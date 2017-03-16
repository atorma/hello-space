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

const ROCKET_NOSE_BODY_Q: Quaternion = new Quaternion(1, 0, 0, 0);

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
 * Returns a vector whose direction is the rocket's nose's direction (thrust direction)
 * in the world frame.
 *
 * @param rocketsCurrentOrientation
 * @return {Vec3}
 */
export function getRocketNoseDirection(rocketsCurrentOrientation: Quaternion): Vec3 {
    const rocketNoseRotationInWorld: Quaternion = rocketsCurrentOrientation.mult(ROCKET_NOSE_BODY_Q).mult(rocketsCurrentOrientation.inverse());
    return new Vec3(rocketNoseRotationInWorld.x, rocketNoseRotationInWorld.y, rocketNoseRotationInWorld.z);
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