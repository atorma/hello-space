import {Quaternion, Vec3} from 'cannon';
import * as o from './orientation';
import * as helpers from './helpers.spec';
import {RunPhysics, Controls, RocketState, WorldState} from './external/physics';
import {RPYAngles} from "./orientation";

describe('convertQuaternionToRPYAngles', () => {

    // See http://quaternions.online/, use Euler Angles > YZX-Order (Radians)
    it('converts quaternions to roll, pitch, yaw angles in order yaw, pitch, roll (YZX)', () => {
        let q: Quaternion;
        let a: o.RPYAngles;

        q = new Quaternion(0, 0, 0, 1);
        a = o.convertQuaternionToRPYAngles(q);
        expect(a).toEqual(new o.RPYAngles(0, 0, 0));

        q.setFromAxisAngle(new Vec3(1, 0, 0), Math.PI/3);
        a = o.convertQuaternionToRPYAngles(q);
        expect(a).toEqual(new o.RPYAngles(Math.PI/3, 0, 0));

        q.setFromAxisAngle(new Vec3(0, 1, 0), -1);
        a = o.convertQuaternionToRPYAngles(q);
        expect(a).toEqual(new o.RPYAngles(-0, -1, 0));

        q.set(0.449, 0.184, 0.761, 0.432);
        a = o.convertQuaternionToRPYAngles(q);
        expect(a.roll).toBeCloseTo(2.951, 0.001);
        expect(a.pitch).toBeCloseTo(-1.976, 0.001);
        expect(a.yaw).toBeCloseTo(0.964, 0.001);
    });

});

describe('rotation directions', () => {

    let rocketOnlyState: WorldState;

    beforeEach(() => {
        rocketOnlyState = helpers.createWorldStateWithRocketOnly();
    });

    it('positive force creates positive angular velocity and positive rotation angle', () => {
        const controls: Controls = new Controls({rcs: {
            roll: 1,
            pitch: 1,
            yaw: 1
        }});
        let state: WorldState = rocketOnlyState;

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

});