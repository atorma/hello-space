import {WorldState, Controls, RocketState, PlanetState, ControlParams} from "./external/physics";
import {Vec3} from "cannon";
import {VelocityController} from "./velocity_controller";
import {circularMotion} from "./moon_position";
import Constants = require("./physical_constants");
import {RotationController} from "./rcs_pid_control";

const velocityController: VelocityController = new VelocityController();
const rotationController: RotationController = new RotationController();

const EXCESS_VELOCITY: number = 8;

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

    let controlParams: ControlParams = {};
    if (rocketDistanceToEarth < 5) {
        // Lift-off phase 1, straight up
        controlParams = {thrust: 1};
    } else if (rocketDistanceToEarth < 18) {
        // Lift-off phase 2, 90 degrees turn
        controlParams = {thrust: 1};
        rotationController.setOrientationTarget(new Vec3(0, 1, 0));
        controlParams.rcs = rotationController.update(rocket);
    } else {
        controlParams = aimAtTheMoon();
    }

    return new Controls(controlParams);
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

// Assuming that the Moon is rotating around the Earth in perfect circular motion, find
// a rocket velocity vector that would take the rocket to the Moon from its current
// position at velocity magnitude moon velocity + EXCESS_VELOCITY.
function aimAtTheMoon(): ControlParams {
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
    const targetVelocity = targetDirection.mult(moon.velocity.norm() + EXCESS_VELOCITY);

    const rocketPosition: Vec3 = rocket.position.vadd(targetVelocity.mult(time));
    const distanceToMoon = moonPredictedPosition.vsub(rocketPosition).norm();

    return [distanceToMoon, targetVelocity];
}