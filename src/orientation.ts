import {Vec3, Quaternion} from 'cannon';

export class RPYAngles {
    constructor(readonly roll: number, readonly pitch: number, readonly yaw: number) {}
}

/**
 * Computes the roll, pitch, and yaw angles to a vector that is in
 * the rocket's body coordinates. The resulting rotation aligns
 * the rocket's nose direction with the target vector.
 *
 * @param bodyVector
 * @return {RPYAngles}
 */
export function getRPYAnglesToBodyVector(bodyVector: Vec3): RPYAngles {
    const rocketNose = new Vec3(1, 0, 0);
    const rotation = new Quaternion();
    rotation.setFromVectors(bodyVector, rocketNose);
    return convertQuaternionToRPYAngles(rotation);
}

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