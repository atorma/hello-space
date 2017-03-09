import {RotationController, RcsControlParams} from "./rcs_pid_control";
import * as helpers from './helpers.spec';
import {RunPhysics, Controls, RocketState, WorldState} from './external/physics';
import {Quaternion, Vec3} from 'cannon';

describe('RCS pid control', () => {

    let controller: RotationController;

    beforeEach(() => {
        controller = new RotationController();
    });

    function createRocketOnlyState(rotation?: Quaternion, angularVelocity?: Vec3): WorldState {
        const rocketState: RocketState = helpers.createRocketState({
            rotation: rotation,
            angularVelocity: angularVelocity,
            position: new Vec3(0, 0, 0)
        });
        return new WorldState(rocketState, []);
    }

    it('sets non-zero angular velocity when starting from rest', () => {
        let state: WorldState = createRocketOnlyState();
        expect(state.rocket.angularVelocity).toEqual(new Vec3(0, 0, 0));

        const target: Vec3 = new Vec3(-1.5, 0.2, 0.5);
        controller.setAngularVelocityTarget(target);

        for (let i = 0; i < 40; i++) {
            const rcsParams: RcsControlParams = controller.update(state.rocket);
            const controls: Controls = new Controls({thrust: 0, rcs: rcsParams});
            state = RunPhysics(state, controls);
        }

        expect(state.rocket.angularVelocity.x).toBeCloseTo(target.x, 2);
        expect(state.rocket.angularVelocity.y).toBeCloseTo(target.y, 3);
        expect(state.rocket.angularVelocity.z).toBeCloseTo(target.z, 3);
    });

    it('stops rotation when starting from non-zero angular velocity', () => {
        let state: WorldState = createRocketOnlyState(new Quaternion(), new Vec3(1.5, -0.5, 0.3));

        const target: Vec3 = new Vec3(0, 0, 0);
        controller.setAngularVelocityTarget(target);

        for (let i = 0; i < 40; i++) {
            const rcsParams: RcsControlParams = controller.update(state.rocket);
            const controls: Controls = new Controls({thrust: 0, rcs: rcsParams});
            state = RunPhysics(state, controls);
        }

        expect(state.rocket.angularVelocity.x).toBeCloseTo(target.x, 2);
        expect(state.rocket.angularVelocity.y).toBeCloseTo(target.y, 3);
        expect(state.rocket.angularVelocity.z).toBeCloseTo(target.z, 3);
    });
});