import {World, Body, Sphere, Box, Vec3, Quaternion, NaiveBroadphase, Material, ContactMaterial} from 'cannon'
import {
    gravitation as G,
    timeStep,
    maxThrust,
    maxGimbalAngleDegrees,
    fuelConsumption,
    rocketSize,
    rcsThrustRatio
} from './constants'
import {Gravitation, deg2rad} from './formulas'
import {combinations} from './array'

const [sX, sY, sZ] = rocketSize;
// cannonjs takes half extents vs THREE takes full
const rocketExtents = new Vec3(sX / 2, sY / 2, sZ / 2);

export function RunPhysics(state: WorldState, controls: Controls): WorldState {
    const world = new World();
    world.broadphase = new NaiveBroadphase();
    world.solver.iterations = 10;

    const rocketBody: Body = createRocketRigidBody(state.rocket);

    const planetBodies: PlanetBodyDescriptor[] = state.planetStates.map((planet) => {
        return {
            name: planet.name,
            body: createPlanetRigidBody(planet)
        } as PlanetBodyDescriptor
    });

    const allBodies: Body[] = [
        rocketBody
    ].concat(planetBodies.map((descr) => descr.body));

    allBodies.forEach(world.addBody.bind(world));

    world.addContactMaterial(createContactMaterial(allBodies));

    createGravitationForces(allBodies).forEach((bodyForces: [Body, [Vec3]]) => {
        const [body, forces] = bodyForces;
        forces.forEach((f: Vec3) => body.applyForce(f, body.position))
    });

    applyFakeGravityToCalculateFriction(world);

    const userControls = (controls instanceof Controls && controls) || new Controls({});
    const fuelState = applyUserControls(userControls, state, rocketBody);

    world.step(timeStep);

    let velocityDifference = rocketBody.velocity.distanceTo(state.rocket.velocity);

    // Did we hit something? Explode!
    let exploded = (velocityDifference >= 5.0) ? true : state.rocket.exploded;

    return new WorldState(
        RocketState.fromBody(rocketBody, fuelState, exploded),
        planetBodies.map((descr) => PlanetState.fromBody(descr.name, descr.body))
    )
}
function applyUserControls(controls: Controls, state: WorldState, rocketBody: Body) {
    if (state.rocket.fuel.volume > 0) {
        applyThrustFromControls(rocketBody, controls);
        applyRcsFromControls(rocketBody, controls);
        return consumeFuelFromControls(state.rocket.fuel, controls)
    } else {
        return state.rocket.fuel
    }
}

function applyRcsFromControls(rocket: Body, controls: Controls) {
    if (controls.rcs) {
        const yaw = limit(-1.0, 1.0, controls.rcs.yaw || 0);
        const pitch = limit(-1.0, 1.0, controls.rcs.pitch || 0);
        const roll = limit(-1.0, 1.0, controls.rcs.roll || 0);
        const [x, y, z] = rocket.angularVelocity.toArray();
        const [sX, sY, sZ] = [
            x + (roll * rcsThrustRatio),
            y + (pitch * rcsThrustRatio),
            z + (yaw * rcsThrustRatio)
        ];
        rocket.angularVelocity.set(sX, sY, sZ)
    }
}

function limit(min: number, max: number, num: number) {
    return Math.max(min, Math.min(max, num))
}

function applyThrustFromControls(rocket: Body, controls: Controls) {
    const thrustRatio = Math.max(0, Math.min(controls.thrust, 1.0));
    rocket.applyLocalForce(new Vec3(maxThrust * thrustRatio, 0, 0), new Vec3(-2.0, 0, 0))
}

function consumeFuelFromControls(fuel: FuelState, controls: Controls): FuelState {
    if (controls.thrust != 0) {
        const residueRatio = 1 - (fuelConsumption / fuel.volume);
        const fuelMass = Math.max(0, (fuel.mass * residueRatio));
        const fuelVolume = fuel.volume - fuelConsumption;
        return new FuelState(fuelMass, fuelVolume)
    } else {
        return fuel
    }
}

// this function counters cannon.js issue #224
function applyFakeGravityToCalculateFriction(w: World) {
    const yDelta = 2;
    w.gravity.set(w.gravity.x, w.gravity.y + yDelta, w.gravity.z);
    w.bodies.filter((b) => b.type === Body.DYNAMIC).forEach((b) => b.force.y -= b.mass * yDelta)
}

function createContactMaterial(bodies: Body[]): ContactMaterial {
    const material = new Material("ground");
    bodies.forEach((b) => b.material = material);
    return new ContactMaterial(material, material, {
        friction: 1.0,
        restitution: 0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e8,
        frictionEquationRegularizationTime: 3,
    })
}


function createRocketRigidBody(rocket: RocketState): Body {
    return new Body({
        mass: rocket.mass,
        position: rocket.position,
        quaternion: rocket.rotation,
        velocity: rocket.velocity,
        angularVelocity: rocket.angularVelocity,
        shape: new Box(rocketExtents),
        linearDamping: 0,
        angularDamping: 0,
        fuel: {
            mass: rocket.fuel.mass,
            volume: rocket.fuel.volume
        }
    })
}

function createPlanetRigidBody(planet: PlanetState): Body {
    return new Body({
        name: planet.name,
        mass: planet.mass,
        position: planet.position,
        velocity: planet.velocity,
        shape: new Sphere(planet.radius),
        linearDamping: 0,
        angularDamping: 0
    })
}

function createGravitationForces(bodies: Body[]): Array<[Body, [Vec3]]> {
    return combinations(2, bodies).reduce((acc: [[Body, [Vec3]]], curr: [Body, Body]): Array<[Body, [Vec3]]> => {
        const g = Gravitation(curr[0], curr[1]);
        const accFind = (b: Body) => acc.find((it: [Body, [Vec3]]) => {
            return it[0] === b
        });
        const firstBody = accFind(curr[0]);
        if (!firstBody) {
            acc.push([curr[0], [g[0]]])
        } else {
            firstBody[1].push(g[0])
        }
        const secondBody = accFind(curr[1]);
        if (!secondBody) {
            acc.push([curr[1], [g[1]]])
        } else {
            secondBody[1].push(g[1])
        }
        return acc
    }, [])
}

export class WorldState {
    constructor(readonly rocket: RocketState,
                readonly planetStates: PlanetState[]) {
    }
}
export interface ControlParams {
    thrust?: number,
    rcs?: {
        yaw?: number,
        pitch?: number,
        roll?: number
    }
}

export class Controls {
    readonly thrust: number;
    readonly rcs: {
        readonly yaw: number,
        readonly pitch: number,
        readonly roll: number
    };

    constructor(params: ControlParams) {
        const prms = params || {};
        this.thrust = prms.thrust || 0;
        this.rcs = (prms.rcs && {
                yaw: prms.rcs.yaw || 0,
                pitch: prms.rcs.pitch || 0,
                roll: prms.rcs.roll || 0
            }) || {
                yaw: 0,
                pitch: 0,
                roll: 0
            }
    }
}

export class RocketState {
    constructor(readonly mass: number,
                readonly position: Vec3,
                readonly rotation: Quaternion,
                readonly velocity: Vec3,
                readonly angularVelocity: Vec3,
                readonly exploded: boolean,
                readonly fuel: FuelState,) {
    }

    static fromBody(body: Body, fuel: FuelState, exploded: boolean): RocketState {
        return new RocketState(body.mass, body.position, body.quaternion, body.velocity, body.angularVelocity, exploded, fuel)
    }
}

export class FuelState {
    constructor(readonly mass: number,
                readonly volume: number) {
    }
}

export class PlanetState {
    constructor(readonly name: string,
                readonly mass: number,
                readonly radius: number,
                readonly position: Vec3,
                readonly rotation: Quaternion,
                readonly velocity: Vec3,
                readonly angularVelocity: Vec3) {
    }

    static fromBody(name: string, body: Body): PlanetState {
        const shape = body.shapes[0] as Sphere;
        return new PlanetState(name, body.mass, shape.radius, body.position, body.quaternion, body.velocity, body.angularVelocity)
    }
}

interface PlanetBodyDescriptor {
    name: string;
    body: Body;
}
