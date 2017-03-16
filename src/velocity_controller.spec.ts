import {RunPhysics, Controls, WorldState, ControlParams} from "./external/physics";
import {InitialState} from "./external/initialstate";
import {VelocityController} from "./velocity_controller";
import {Vec3} from "cannon";
import {createRocketState} from "./helpers.spec";
import {radiansToDegrees, getAngleRadiansBetween} from "./orientation";

describe('VelocityController', () => {

    let initialState: WorldState;

    beforeEach(() => {
        initialState = InitialState.create();
    });

    it('drives the rocket to the target velocity vector from rest', () => {
        const targetVelocity: Vec3 = new Vec3(8, 5, 1);

        const controller = new VelocityController();
        controller.setTarget(targetVelocity);

        let world: WorldState = new WorldState(createRocketState(), []);
        for (let i = 0; i < 200; i++) {
            const controlParams: ControlParams = controller.update(world.rocket);
            const controls: Controls = new Controls(controlParams);
            world = RunPhysics(world, controls);
        }

        expect(world.rocket.velocity.norm()/targetVelocity.norm()).toBeLessThan(1.01);
        expect(world.rocket.velocity.norm()/targetVelocity.norm()).toBeGreaterThan(0.99);
        expect(radiansToDegrees(getAngleRadiansBetween(world.rocket.velocity, targetVelocity))).toBeLessThan(1);
    });

});