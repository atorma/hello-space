import {Vec3, Quaternion} from 'cannon';

/**
 * Describes a rotation. In this convention, the rotation axes are as in http://www.euclideanspace.com/maths/standards/index.htm
 *
 * * roll:  x-axis, bank
 * * pitch: y-axis, heading
 * * yaw:   z-axis, attitude
 */
export class RPYAngles {
    constructor(readonly roll: number, readonly pitch: number, readonly yaw: number) {}
}

const ROCKET_NOSE_BODY: Vec3 = new Vec3(1, 0, 0);

/**
 * Converts a quaternion to roll, pitch, and yaw angles. The
 * order of rotations is pitch, yaw, roll (YZX).
 *
 * @param quaternion
 * @return {RPYAngles}
 */
export function convertQuaternionToRPYAngles(quaternion: Quaternion): RPYAngles {
    const eulerAngles = new Vec3();
    quaternion.toEuler(eulerAngles);
    return new RPYAngles(eulerAngles.x, eulerAngles.y, eulerAngles.z);
}

/**
 * Computes the result of rotating the given vector by the given quaternion.
 *
 * @param vector
 * @param rotation
 * @return {Vec3}
 */
export function rotate(vector: Vec3, rotation: Quaternion): Vec3 {
    const v: Quaternion = new Quaternion(vector.x, vector.y, vector.z, 0);
    const vRot: Quaternion = rotation.mult(v).mult(rotation.inverse());
    return new Vec3(vRot.x, vRot.y, vRot.z);
}

/**
 * Returns a vector whose direction is the rocket's nose's direction (thrust direction)
 * in the world frame.
 *
 * @param rocketsCurrentOrientation
 * @return {Vec3}
 */
export function getRocketNoseDirection(rocketsCurrentOrientation: Quaternion): Vec3 {
    return rotate(ROCKET_NOSE_BODY, rocketsCurrentOrientation);
}

/**
 * Computes the angle between two vectors (in radians).
 *
 * @param vec1
 * @param vec2
 * @return {number}
 */
export function getAngleRadiansBetween(vec1: Vec3, vec2: Vec3): number {
    return Math.acos(vec1.dot(vec2)/vec1.norm()/vec2.norm());
}

/**
 * Converts radians to degrees.
 *
 * @param radians
 * @return {number}
 */
export function radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

/**
 * Converts degrees to radians.
 *
 * @param degrees
 * @return {number}
 */
export function degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
}