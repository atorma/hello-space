import {RocketState, FuelState, PlanetState} from './external/physics';
import {Vec3, Quaternion, Body, Sphere, Box} from 'cannon';
import {rocketSize} from './external/constants';

const [sX, sY, sZ] = rocketSize;
const rocketExtents = new Vec3(sX / 2, sY / 2, sZ / 2);

export interface RocketStateParams {
    mass?: number,
    position?: Vec3,
    rotation?: Quaternion,
    velocity?: Vec3,
    angularVelocity?: Vec3,
    exploded?: boolean,
    fuel?: FuelState
}

export function createRocketState(params?: RocketStateParams): RocketState {
    params = params || {};
    return new RocketState(
        params.mass || 10,
        params.position || new Vec3(20 + rocketSize[0] / 2, 0, 0),
        params.rotation ||  new Quaternion(0, 0, 0, 1),
        params.velocity || new Vec3(0, 0, 0),
        params.angularVelocity || new Vec3(0, 0, 0),
        params.exploded || false,
        params.fuel || new FuelState(
            0.000005,                // mass
            95                       // volume
        )
    );
}

export function createPlanetRigidBody(planet: PlanetState): Body {
    return new Body({
        name: planet.name,
        mass: planet.mass,
        position: planet.position,
        velocity: planet.velocity,
        shape: new Sphere(planet.radius),
        linearDamping: 0,
        angularDamping: 0
    });
}

export function createRocketRigidBody(rocket: RocketState): Body {
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