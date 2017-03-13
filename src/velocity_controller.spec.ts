import {RunPhysics, Controls, WorldState, ControlParams} from "./external/physics";
import {InitialState} from "./external/initialstate";
import {VelocityController} from "./velocity_controller";

describe('VelocityController', () => {

    let initialState: WorldState;

    beforeEach(() => {
        initialState = InitialState.create();
    });

    it('accelerates the rocket to the target velocity maintains the velocity until fuel runs out', () => {
        let world: WorldState = initialState;
        const targetVelocity: number = 10;
        const launchController = new VelocityController(targetVelocity);
        let velocity: number = world.rocket.velocity.norm();
        let maxVelocity: number = velocity;

        for (let i = 0; i < 1000; i++) {
            const controlParams: ControlParams = launchController.update(world.rocket);
            const controls: Controls = new Controls(controlParams);
            world = RunPhysics(world, controls);
            const updatedVelocity: number = world.rocket.velocity.norm();

            if (world.rocket.fuel.volume > 0) {
                if (updatedVelocity < 0.99 * targetVelocity) {
                    expect(updatedVelocity).toBeGreaterThan(velocity);
                } else {
                    expect(updatedVelocity).toBeGreaterThan(0.99 * targetVelocity);
                    expect(updatedVelocity).toBeLessThan(1.01 * targetVelocity);
                }
            }

            velocity = updatedVelocity;
            if (velocity > maxVelocity) {
                maxVelocity = velocity;
            }
        }

        expect(maxVelocity).toBeGreaterThan(0.99 * targetVelocity);
        expect(maxVelocity).toBeLessThan(1.01 * targetVelocity);
    });

});