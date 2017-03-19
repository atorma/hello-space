import {WorldState, Controls, RocketState, PlanetState, ControlParams} from "./external/physics";
import {Vec3} from "cannon";
import {VelocityController} from "./velocity_controller";
import {circularMotion} from "./moon_position";
import {RotationController} from "./rcs_pid_control";
import Constants = require("./physical_constants");

const velocityController: VelocityController = new VelocityController();
const rotationController: RotationController = new RotationController();

const MIN_FUEL_VOLUME: number = Constants.fuelConsumption;
const EXCESS_TRAVEL_VELOCITY: number = 6;
const LANDING_VELOCITY: number = 1;

let world: WorldState;
let rocket: RocketState;
let moon: PlanetState;
let earth: PlanetState;
let moonDistanceFromEarth: Vec3;
let moonAngularVelocityAroundEarth: Vec3;
let rocketDistanceToEarth: number;
let rocketDistanceToMoon: number;

////////////// Functions //////////////

export function goToMoon(worldState: WorldState): Controls {
    world = worldState;
    updateState();

    if (rocketDistanceToEarth < 3) {
        return new Controls(liftOffPhase1());
    }

    if (rocketDistanceToEarth < 10) {
        return new Controls(liftOffPhase2());
    }

    if (rocketDistanceToMoon >= 40) {
        return new Controls(travelToMoon());
    }

    if (rocketDistanceToMoon >= 15) {
        return new Controls(initiateLanding());
    }

    return new Controls(finalizeLanding());
}

function updateState(): void {
    rocket = world.rocket;
    moon = world.planetStates.find(p => p.name === 'Moon');
    earth = world.planetStates.find(p => p.name === 'Earth2');

    rocketDistanceToEarth = rocket.position.distanceTo(earth.position) - earth.radius;
    rocketDistanceToMoon = rocket.position.distanceTo(moon.position) - moon.radius;

    // Assuming that the Moon is rotating around the Earth in perfect circular motion
    moonDistanceFromEarth = moon.position.vsub(earth.position);
    moonAngularVelocityAroundEarth = moonDistanceFromEarth.cross(moon.velocity).mult(1 / moonDistanceFromEarth.norm2());
}

// Lift-off phase 1, straight up from the Earth
function liftOffPhase1(): ControlParams {
    return {thrust: 1};
}

// Lift of phase 1, orient towards the Moon but keep applying thrust to escape
// the Earth's gravity
function liftOffPhase2(): ControlParams {
    rotationController.setOrientationTarget(moon.position.vsub(rocket.position));
    return {
        thrust: 1,
        rcs: rotationController.update(rocket)
    };
}

// Assuming that the Moon is rotating around the Earth in perfect circular motion, find
// a rocket velocity vector that would take the rocket to the Moon from its current
// position at velocity magnitude moon velocity + EXCESS_TRAVEL_VELOCITY.
function travelToMoon(): ControlParams {
    const timeStep = 2;
    let iter: number = 0;
    let minDistance: number = Infinity;
    let velocityForMinDistance: Vec3 = rocket.velocity;

    while (iter < 500) {
        const time = iter * timeStep;
        let targetVelocity: Vec3, distance: number;
        [distance, targetVelocity] = getTargetVelocityAndDistanceToMoon(time);

        if (distance > minDistance) {
            velocityController.setTarget(velocityForMinDistance);
            return velocityController.update(rocket);
        }

        minDistance = distance;
        velocityForMinDistance = targetVelocity;
        iter = iter + 1;
    }

    throw new Error('Unable to find vector to Moon');
}

function getTargetVelocityAndDistanceToMoon(time: number): [number, Vec3] {
    const moonPredictedPositionFromEarth: Vec3 = circularMotion(moonDistanceFromEarth, moonAngularVelocityAroundEarth, time);
    const moonPredictedPosition: Vec3 = earth.position.vadd(moonPredictedPositionFromEarth);

    const targetDirection = moonPredictedPosition.vsub(rocket.position);
    targetDirection.normalize();
    const targetVelocity = targetDirection.mult(Math.max(moon.velocity.norm() + EXCESS_TRAVEL_VELOCITY, rocket.velocity.norm()));

    const rocketPosition: Vec3 = rocket.position.vadd(targetVelocity.mult(time));
    const distanceToMoon = moonPredictedPosition.vsub(rocketPosition).norm();

    return [distanceToMoon, targetVelocity];
}

// Controls rocket velocity so that it's flying almost at the same velocity vector as the Moon but with
// small additional component from the rocket towards the moon.
function initiateLanding(): ControlParams {
    const landingDirection: Vec3 = moon.position.vsub(rocket.position);
    landingDirection.normalize();

    const moonVelocityInLandingDirection: Vec3 = landingDirection.mult(landingDirection.dot(moon.velocity));

    const moonVelocityInChaseDirection: Vec3 = moon.velocity.vsub(moonVelocityInLandingDirection);
    const chaseDirection: Vec3 = moonVelocityInChaseDirection.clone();
    chaseDirection.normalize();

    const landingVelocity: Vec3 = landingDirection.mult(LANDING_VELOCITY);
    const targetVelocity: Vec3 = moonVelocityInChaseDirection.vadd(moonVelocityInLandingDirection).vadd(landingVelocity);

    velocityController.setTarget(targetVelocity);
    return velocityController.update(rocket);
}

// Turn the rocket tail towards the Moon, let the gravity pull the rocket into the moon.
// Hopefully at this point the landing velocity is low enough.
function finalizeLanding(): ControlParams {
    const moonDirection: Vec3 = moon.position.vsub(rocket.position);
    rotationController.setOrientationTarget(moonDirection.mult(-1));
    return {
        thrust: 0,
        rcs: rotationController.update(rocket)
    };
}