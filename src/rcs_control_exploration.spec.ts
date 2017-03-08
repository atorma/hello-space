import {Quaternion, Vec3} from 'cannon';
import * as o from './orientation';
import * as helpers from './helpers.spec';
import {RunPhysics, Controls, RocketState, WorldState} from './external/physics';
import {RPYAngles} from "./orientation";
import {rocketSize} from './external/constants';

describe('Rocket rcs controls', () => {

    function createRocketOnlyState(rotation?: Quaternion, angularVelocity?: Vec3): WorldState {
        const rocketState: RocketState = helpers.createRocketState({
            rotation: rotation,
            angularVelocity: angularVelocity,
            position: new Vec3(0, 0, 0)
        });
        return new WorldState(rocketState, []);
    }

    it('positive rcs creates positive angular velocity and positive rotation angle', () => {
        let state: WorldState = createRocketOnlyState();

        const controls: Controls = new Controls({
            rcs: {
                roll: 1,
                pitch: 1,
                yaw: 1
            }
        });

        for (let i = 0; i < 10; i++) {
            state = RunPhysics(state, controls);
            const angularVelocity: Vec3 = state.rocket.angularVelocity;
            const rotation: Quaternion = state.rocket.rotation;

            expect(angularVelocity.x).toBeGreaterThan(0);
            expect(angularVelocity.y).toBeGreaterThan(0);
            expect(angularVelocity.z).toBeGreaterThan(0);
            expect(angularVelocity.x).toBe(angularVelocity.y);
            expect(angularVelocity.x).toBe(angularVelocity.z);

            const rpyAngles: RPYAngles = o.convertQuaternionToRPYAngles(rotation);
            expect(rpyAngles.roll).toBeGreaterThan(0);
            expect(rpyAngles.pitch).toBeGreaterThan(0);
            expect(rpyAngles.yaw).toBeGreaterThan(0);
            expect(rpyAngles.roll).toBeCloseTo(rpyAngles.pitch, 0.0001);
            expect(rpyAngles.roll).toBeCloseTo(rpyAngles.yaw, 0.0001);
        }
    });

    it('directly affects angular velocity component in a non-rotating frame fixed to the rocket (instead of affecting in rotated coordinates like aircraft control forces)', () => {
        let rocketState: RocketState;
        let state: WorldState;
        let rotation: Quaternion;
        let rpyAngles, previousRpyAngles: RPYAngles;
        let controls: Controls;

        // Rocket initially not rotated, then yaw rcs applied.
        // Of course, only the yaw angle changes.
        rocketState = helpers.createRocketState({
            rotation: new Quaternion(0, 0, 0, 1)
        });
        state = new WorldState(rocketState, []);
        rotation = state.rocket.rotation;
        rpyAngles = o.convertQuaternionToRPYAngles(rotation);
        expect(rpyAngles.roll).toBe(0);
        expect(rpyAngles.pitch).toBe(0);
        expect(rpyAngles.yaw).toBe(0);
        controls = new Controls({rcs: {yaw: 1}});
        for (let i = 0; i < 30; i++) {
            previousRpyAngles = rpyAngles;
            state = RunPhysics(state, controls);
            rpyAngles = o.convertQuaternionToRPYAngles(state.rocket.rotation);
            expect(rpyAngles.roll).toBe(0);
            expect(rpyAngles.pitch).toBe(0);
            expect(rpyAngles.yaw).toBeGreaterThan(previousRpyAngles.yaw);
        }

        // Rocket initially rotated 45 deg around the pitch (y) axis, then yaw rcs applied.
        // If rcs affected in body coordinates fixed so that the rocket's nose is always the x-axis, then
        // the pitch angle should not change anymore. However, it does, because the angular velocity component
        // is on the non-rotated z-axis.
        rotation.setFromAxisAngle(new Vec3(0, 1, 0), Math.PI / 4);
        rocketState = helpers.createRocketState({
            rotation: rotation
        });
        state = new WorldState(rocketState, []);
        rpyAngles = o.convertQuaternionToRPYAngles(state.rocket.rotation);
        expect(rpyAngles.roll).toBe(0);
        expect(rpyAngles.pitch).toBeCloseTo(Math.PI / 4, 0.000001);
        expect(rpyAngles.yaw).toBe(0);
        controls = new Controls({rcs: {yaw: 1}});
        for (let i = 0; i < 30; i++) {
            previousRpyAngles = rpyAngles;
            state = RunPhysics(state, controls);
            rpyAngles = o.convertQuaternionToRPYAngles(state.rocket.rotation);
            expect(rpyAngles.roll).toBeLessThan(previousRpyAngles.roll);
            expect(rpyAngles.pitch).toBeGreaterThan(previousRpyAngles.pitch); // !!!
            expect(rpyAngles.yaw).toBeGreaterThan(previousRpyAngles.yaw);
        }

        // Rocket initially rotated 45 deg around the yaw (z) axis, then roll rcs applied.
        // If rcs affected in body coordinates fixed so that the rocket's nose is always the x-axis, then
        // the yaw angle should not change anymore. However, it does, because the angular velocity component
        // is on the non-rotated x-axis.
        rotation = new Quaternion();
        rotation.setFromAxisAngle(new Vec3(0, 0, 1), Math.PI / 4);
        rocketState = helpers.createRocketState({
            rotation: rotation
        });
        state = new WorldState(rocketState, []);
        rotation = state.rocket.rotation;
        rpyAngles = o.convertQuaternionToRPYAngles(rotation);
        expect(rpyAngles.roll).toBe(0);
        expect(rpyAngles.pitch).toBe(0);
        expect(rpyAngles.yaw).toBeCloseTo(Math.PI / 4, 0.000001);
        controls = new Controls({rcs: {roll: 1}});
        for (let i = 0; i < 30; i++) {
            previousRpyAngles = rpyAngles;
            state = RunPhysics(state, controls);
            rpyAngles = o.convertQuaternionToRPYAngles(state.rocket.rotation);
            expect(rpyAngles.roll).toBeGreaterThan(previousRpyAngles.roll);
            expect(rpyAngles.pitch).toBeLessThan(previousRpyAngles.pitch);
            expect(rpyAngles.yaw).toBeLessThan(previousRpyAngles.yaw);  // !!!
        }

        // Rocket initially rotated 45 deg around the roll (x) axis, then yaw rcs applied.
        // In this case neither roll nor pitch change, only yaw. This is because the angular
        // velocity vector is perpendicular to the initial rotation axis.
        rotation = new Quaternion();
        rotation.setFromAxisAngle(new Vec3(1, 0, 0), Math.PI / 4);
        rocketState = helpers.createRocketState({
            rotation: rotation
        });
        state = new WorldState(rocketState, []);
        rotation = state.rocket.rotation;
        rpyAngles = o.convertQuaternionToRPYAngles(rotation);
        expect(rpyAngles.roll).toBeCloseTo(Math.PI / 4, 0.000001);
        expect(rpyAngles.pitch).toBe(0);
        expect(rpyAngles.yaw).toBe(0);
        controls = new Controls({rcs: {yaw: 1}});
        for (let i = 0; i < 10; i++) {
            previousRpyAngles = rpyAngles;
            state = RunPhysics(state, controls);
            rpyAngles = o.convertQuaternionToRPYAngles(state.rocket.rotation);
            expect(rpyAngles.roll).toBeCloseTo(previousRpyAngles.roll, 1e-15);
            expect(rpyAngles.pitch).toBeCloseTo(previousRpyAngles.pitch, 1e-15);
            expect(rpyAngles.yaw).toBeGreaterThan(previousRpyAngles.yaw + 0.0001);
        }
    });

});
