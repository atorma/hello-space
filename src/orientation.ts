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
 * Computes the reflection of vector vec from a plane defined by the given normal vector.
 *
 * @param vec - vector to reflect
 * @param normal - normal of the plane
 * @return {Vec3} - reflection of vec
 */
export function getReflection(vec: Vec3, normal: Vec3): Vec3 {
    const qVec = new Quaternion(vec.x, vec.y, vec.z, 0);
    const qNormal = new Quaternion(normal.x, normal.y, normal.z, 0);
    const qReflect = qNormal.mult(qVec).mult(qNormal);
    return new Vec3(qReflect.x, qReflect.y, qReflect.z);
}

/**
 * Computes the angle between two vectors (in radians).
 *
 * @param vec1
 * @param vec2
 * @return {number}
 */
export function getAngleBetween(vec1: Vec3, vec2: Vec3): number {
    return Math.acos(vec1.dot(vec2)/vec1.norm()/vec2.norm());
}