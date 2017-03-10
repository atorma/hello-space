import {Quaternion, Vec3} from 'cannon';
import * as o from './orientation';
import * as helpers from './helpers.spec';
import {RunPhysics, Controls, RocketState, WorldState, FuelState} from './external/physics';
import {RPYAngles} from "./orientation";
import {rocketSize} from './external/constants';

describe('convertQuaternionToRPYAngles()', () => {

    // See http://quaternions.online/, use Euler Angles > YZX-Order (Radians)
    it('converts quaternions to roll, pitch, yaw angles in order yaw, pitch, roll (YZX)', () => {
        let q: Quaternion;
        let a: o.RPYAngles;

        q = new Quaternion(0, 0, 0, 1);
        a = o.convertQuaternionToRPYAngles(q);
        expect(a).toEqual(new o.RPYAngles(0, 0, 0));

        q.setFromAxisAngle(new Vec3(1, 0, 0), Math.PI / 3);
        a = o.convertQuaternionToRPYAngles(q);
        expect(a).toEqual(new o.RPYAngles(Math.PI / 3, 0, 0));

        q.setFromAxisAngle(new Vec3(0, 1, 0), -1);
        a = o.convertQuaternionToRPYAngles(q);
        expect(a).toEqual(new o.RPYAngles(-0, -1, 0));

        q.set(0.449, 0.184, 0.761, 0.432);
        a = o.convertQuaternionToRPYAngles(q);
        expect(a.roll).toBeCloseTo(2.951, 2);
        expect(a.pitch).toBeCloseTo(-1.976, 2);
        expect(a.yaw).toBeCloseTo(0.964, 2);
    });

});

describe('getRocketNoseDirection()', () => {

    it('computes a vector whose direction is the rocket\'s nose (thrust) direction in the world frame', () => {
        let orientation: Quaternion;
        let noseDirection: Vec3;
        let expectedDirection: Vec3;

        // No rotation
        orientation = new Quaternion();
        orientation.setFromAxisAngle(new Vec3(1, 0, 0), 0);
        expectedDirection = new Vec3(1, 0, 0);
        noseDirection = o.getRocketNoseDirection(orientation);
        expect(noseDirection).toEqual(expectedDirection);

        // Rotation around x-axis only does not change the rocket's orientation
        orientation = new Quaternion();
        orientation.setFromAxisAngle(new Vec3(1, 0, 0), 1.5);
        expectedDirection = new Vec3(1, 0, 0);
        noseDirection = o.getRocketNoseDirection(orientation);
        expect(noseDirection).toEqual(expectedDirection);

        // 90 deg rotation around y-axis
        orientation = new Quaternion();
        orientation.setFromAxisAngle(new Vec3(0, 1, 0), Math.PI / 2);
        expectedDirection = new Vec3(0, 0, -1);
        noseDirection = o.getRocketNoseDirection(orientation);
        expect(noseDirection.x).toBeCloseTo(expectedDirection.x, 15);
        expect(noseDirection.y).toBeCloseTo(expectedDirection.y, 15);
        expect(noseDirection.z).toBeCloseTo(expectedDirection.z, 15);

        expectedDirection = new Vec3(1, 1, -1);
        orientation = new Quaternion();
        orientation.setFromVectors(new Vec3(1, 0, 0), expectedDirection);
        noseDirection = o.getRocketNoseDirection(orientation);
        expectedDirection.normalize();
        expect(noseDirection.dot(expectedDirection)).toBeCloseTo(1, 15);
        expect(noseDirection.x).toBeCloseTo(expectedDirection.x, 15);
        expect(noseDirection.y).toBeCloseTo(expectedDirection.y, 15);
        expect(noseDirection.z).toBeCloseTo(expectedDirection.z, 15);
    });

});

describe('getRocketRPYToWorldPoint()', () => {

    xit('computes RPY angles that orient the rocket from its current rotation to a target world point', () => {
        let current: Quaternion;
        let target: Vec3;
        let change: o.RPYAngles;

        current = new Quaternion(0, 0, 0, 1); // orientation along positive x-axis
        target = new Vec3(1, 1, 0); // 45 degrees "up" from world x-axis
        change = o.getRocketRPYToWorldPoint(current, target);
        expect(change.roll).toBe(0);
        expect(change.pitch).toBe(0);
        expect(change.yaw).toBeCloseTo(Math.PI / 4, 4);

        current = new Quaternion(0, Math.pow(2, -0.5), 0, Math.pow(2, -0.5)); // Rotated 90 degrees CW around y-axis
        target = new Vec3(1, 1, 0); // 45 degrees "up" from world x-axis, right and up in body coordinates
        change = o.getRocketRPYToWorldPoint(current, target);
        expect(change.roll).toBe(0);
        expect(change.pitch).toBeGreaterThan(0);
        expect(change.yaw).toBeLessThan(0);

        current = new Quaternion(Math.pow(2, -0.5), 0, 0, Math.pow(2, -0.5)); // Rotated 90 degrees CW around roll-axis
        target = new Vec3(1, 1, 0); // 45 degrees "up" from world x-axis, to the right in body coordinates
        change = o.getRocketRPYToWorldPoint(current, target);
        // TODO This is the same as above because taking rocket's nose as a Vec3 "forgets" how it has been rotated around the nose axis. This does not seem right.
        expect(change.roll).toBe(0);
        expect(change.pitch).toBe(0);
        expect(change.yaw).toBeCloseTo(Math.PI / 4, 4);
    });

});