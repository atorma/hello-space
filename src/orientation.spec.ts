import {Quaternion, Vec3} from 'cannon';
import {rocketSize} from './external/constants';
import {getRocketNoseDirection, convertQuaternionToRPYAngles, getReflection, getAngleBetween} from "./orientation";
import {RPYAngles} from "./orientation";

describe('convertQuaternionToRPYAngles()', () => {

    // See http://quaternions.online/, use Euler Angles > YZX-Order (Radians)
    it('converts quaternions to roll, pitch, yaw angles in order yaw, pitch, roll (YZX)', () => {
        let q: Quaternion;
        let a: RPYAngles;

        q = new Quaternion(0, 0, 0, 1);
        a = convertQuaternionToRPYAngles(q);
        expect(a).toEqual(new RPYAngles(0, 0, 0));

        q.setFromAxisAngle(new Vec3(1, 0, 0), Math.PI / 3);
        a = convertQuaternionToRPYAngles(q);
        expect(a).toEqual(new RPYAngles(Math.PI / 3, 0, 0));

        q.setFromAxisAngle(new Vec3(0, 1, 0), -1);
        a = convertQuaternionToRPYAngles(q);
        expect(a).toEqual(new RPYAngles(-0, -1, 0));

        q.set(0.449, 0.184, 0.761, 0.432);
        a = convertQuaternionToRPYAngles(q);
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
        noseDirection = getRocketNoseDirection(orientation);
        expect(noseDirection).toEqual(expectedDirection);

        // Rotation around x-axis only does not change the rocket's orientation
        orientation = new Quaternion();
        orientation.setFromAxisAngle(new Vec3(1, 0, 0), 1.5);
        expectedDirection = new Vec3(1, 0, 0);
        noseDirection = getRocketNoseDirection(orientation);
        expect(noseDirection).toEqual(expectedDirection);

        // 90 deg rotation around y-axis
        orientation = new Quaternion();
        orientation.setFromAxisAngle(new Vec3(0, 1, 0), Math.PI / 2);
        expectedDirection = new Vec3(0, 0, -1);
        noseDirection = getRocketNoseDirection(orientation);
        expect(noseDirection.x).toBeCloseTo(expectedDirection.x, 15);
        expect(noseDirection.y).toBeCloseTo(expectedDirection.y, 15);
        expect(noseDirection.z).toBeCloseTo(expectedDirection.z, 15);

        expectedDirection = new Vec3(1, 1, -1);
        orientation = new Quaternion();
        orientation.setFromVectors(new Vec3(1, 0, 0), expectedDirection);
        noseDirection = getRocketNoseDirection(orientation);
        expectedDirection.normalize();
        expect(noseDirection.dot(expectedDirection)).toBeCloseTo(1, 15);
        expect(noseDirection.x).toBeCloseTo(expectedDirection.x, 15);
        expect(noseDirection.y).toBeCloseTo(expectedDirection.y, 15);
        expect(noseDirection.z).toBeCloseTo(expectedDirection.z, 15);
    });

});

describe('getReflection()', () => {

    it('computes the reflection of vector from a plane', () => {
        let normal: Vec3, vec: Vec3;
        normal = new Vec3(0, 1, 0);

        vec = new Vec3(0, -2, 0);
        expect(getReflection(vec, normal)).toEqual(new Vec3(0, 2, 0));

        vec = new Vec3(0, 2, 0);
        expect(getReflection(vec, normal)).toEqual(new Vec3(0, -2, 0));

        vec = new Vec3(-1, -2, 0);
        expect(getReflection(vec, normal)).toEqual(new Vec3(-1, 2, 0));

        vec = new Vec3(1, 2, 0);
        expect(getReflection(vec, normal)).toEqual(new Vec3(1, -2, 0));

        vec = new Vec3(1, -2, 0);
        expect(getReflection(vec, normal)).toEqual(new Vec3(1, 2, 0));
    });

});

describe('getAngleBetween()', () => {

    it('computes the angle between two vectors', () => {
        let vec1: Vec3, vec2: Vec3;

        vec1 = new Vec3(1, 1, 0);
        vec2 = new Vec3(-1, 1, 0);
        expect(getAngleBetween(vec1, vec2)).toBeCloseTo(Math.PI/2, 15);

        vec1 = new Vec3(1, 1, 0);
        vec2 = new Vec3(0, 1, 0);
        expect(getAngleBetween(vec1, vec2)).toBeCloseTo(Math.PI/4, 15);

        vec1 = new Vec3(1, 1, 0);
        vec2 = new Vec3(1, 0, 0);
        expect(getAngleBetween(vec1, vec2)).toBeCloseTo(Math.PI/4, 15);

        vec1 = new Vec3(1, -1, 0);
        vec2 = new Vec3(0, 1, 0);
        expect(getAngleBetween(vec1, vec2)).toBeCloseTo(Math.PI/2 + Math.PI/4, 15);
    });

});