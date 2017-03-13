export enum Controls {
    PITCH_UP,
    PITCH_DOWN,
    YAW_LEFT,
    YAW_RIGHT,
    THRUST,
    ORIENT_TO_MOON,
    STABILIZE_ROTATION
}

export const ROTATION_AXES: string[] = ['roll', 'pitch', 'yaw'];

export const ROTATION_TO_CARTESIAN_AXIS = {
    roll: 'x',
    pitch: 'y',
    yaw: 'z'
};