import {WorldState, Controls, ControlParams, RocketState, PlanetState} from './external/physics';
import {PIDController, AngularPIDController} from './external/pid_controller';
import {Vec3, Quaternion} from 'cannon';

interface RcsControlParams {
    roll: number;
    pitch: number;
    yaw: number;
}

interface RotationAngles {
    roll: number;
    pitch: number;
    yaw: number;
}

const CONTROL_NAMES = {
    PITCH_UP: 'PITCH_UP',
    PITCH_DOWN: 'PITCH_DOWN',
    YAW_LEFT: 'YAW_LEFT',
    YAW_RIGHT: 'YAW_RIGHT',
    THRUST: 'THRUST',
    ORIENT_TO_MOON: 'ORIENT_TO_MOON',
    STABILIZE_ROTATION: 'STABILIZE_ROTATION'
};
const KEY_CODE_TO_MANUAL_CONTROL = {};
const KEY_CODE_TO_AUTO_CONTROL = {};

const ROTATION_AXES = ['roll', 'pitch', 'yaw'];
const ROTATION_TO_CARTESIAN_AXIS = {
    roll: 'x',
    pitch: 'y',
    yaw: 'z'
};

let controlState = {
    active: {},
    pid: {
        roll: {
            angle: new AngularPIDController(1/Math.PI, 0.02, 0.001),
            velocity: new PIDController(1, 0, 0)
        },
        pitch: {
            angle: new AngularPIDController(1/Math.PI, 0.02, 0.001),
            velocity: new PIDController(1, 0, 0)
        },
        yaw: {
            angle: new AngularPIDController(1/Math.PI, 0.02, 0.001),
            velocity: new PIDController(1, 0, 0)
        },
        updatesSinceReset: 0,
        resetInterval: 10
    }
};

// From WorldState
let rocketState: RocketState;
let moonState: PlanetState;

/**
 * Coordinates in the rocket's frame of reference
 *
 * Rocket body coordinate axes:
 * x-axis = roll axis. Thrust affects in this direction (see e.g. src/physics.ts).
 * y-axis = pitch axis
 * z-axis = yaw axis
 *
 * The positive rotation angle is counter-clockwise (unlike roll-pitch-yaw normally) so
 * that the direction is the same as angular velocity.
 */
let rocketFrame = {
    moon: {
        position: new Vec3(),
        rotation: {roll: 0, pitch: 0, yaw: 0}
    }
};

initControls();

////////////// Functions //////////////

export function goToMoon(worldState): Controls {
    updateWorldStates(worldState);
    updateRocketFrame();
    return new Controls(getControlParams());
}

function updateWorldStates(worldState: WorldState): void {
    rocketState = worldState.rocket;
    moonState = worldState.planetStates.find(function (ps) {
        return ps.name === 'Moon';
    });
}

function updateRocketFrame(): void {
    const moonDirection = moonState.position.vsub(rocketState.position);
    rocketFrame.moon.position = transformToBodyCoordinates(moonDirection);
    rocketFrame.moon.rotation = getPYRToBodyVector(rocketFrame.moon.position);
}

function getControlParams(): ControlParams {
    const controlParams = {
        thrust: 0,
        rcs: {
            roll: 0,
            pitch: 0,
            yaw: 0,
        }
    };

    if (controlState.pid.updatesSinceReset > controlState.pid.resetInterval) {
        ROTATION_AXES.forEach(function (axis) {
            controlState.pid[axis].angle.reset();
            controlState.pid[axis].velocity.reset();
        });
        controlState.pid.updatesSinceReset = 0;
    } else {
        controlState.pid.updatesSinceReset += 1;
    }

    if (controlState.active[CONTROL_NAMES.ORIENT_TO_MOON]) {
        applyOrientationStabilizationParams(controlParams, rocketFrame.moon.rotation);
    } else if (controlState.active[CONTROL_NAMES.STABILIZE_ROTATION]) {
        applyRotationStabilizationParams(controlParams);
    }

    applyManualControlParams(controlParams);

    return controlParams;
}


function applyOrientationStabilizationParams(controlParams: ControlParams, targetBodyPYRRotation: RotationAngles): void {
    ROTATION_AXES.forEach(function (axis) {
        const angle = targetBodyPYRRotation[axis];
        // angle_error = (0 - angle), so for positive angle we get negative error.
        // We have to change the sign of velocity target to get the correct torque direction.
        const angularVelocityTarget = -1 * controlState.pid[axis].angle.update(angle);
        controlState.pid[axis].velocity.target = angularVelocityTarget;
        const angularVelocity = rocketState.angularVelocity[ROTATION_TO_CARTESIAN_AXIS[axis]];
        const torque = controlState.pid[axis].velocity.update(angularVelocity);
        controlParams.rcs[axis] = torque;
    });
}

function applyRotationStabilizationParams(controlParams: ControlParams): void {
    ROTATION_AXES.forEach(function (axis) {
        controlState.pid[axis].velocity.target = 0;
        const angularVelocity = rocketState.angularVelocity[ROTATION_TO_CARTESIAN_AXIS[axis]];
        const torque = controlState.pid[axis].velocity.update(angularVelocity);
        controlParams.rcs[axis] = torque;
    });
}

function applyManualControlParams(controlParams: ControlParams): void {
    if (controlState.active[CONTROL_NAMES.PITCH_UP]) {
        controlParams.rcs.pitch = 0.5;
    }
    if (controlState.active[CONTROL_NAMES.PITCH_DOWN]) {
        controlParams.rcs.pitch = -0.5;
    }
    if (controlState.active[CONTROL_NAMES.YAW_LEFT]) {
        controlParams.rcs.yaw = 0.5;
    }
    if (controlState.active[CONTROL_NAMES.YAW_RIGHT]) {
        controlParams.rcs.yaw = -0.5;
    }
    if (controlState.active[CONTROL_NAMES.THRUST]) {
        controlParams.thrust = 1;
    }
}

/**
 * Computes the pitch, yaw, and roll angles to a vector that is in
 * the rocket's body coordinates. The resulting rotation aligns
 * the rocket's nose direction with the target vector.
 */
function getPYRToBodyVector(bodyVector: Vec3): RcsControlParams {
    const rocketNose = new Vec3(1, 0, 0);
    const rotation = new Quaternion();
    rotation.setFromVectors(bodyVector, rocketNose);
    return getPYRAngles(rotation);
}

// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Quaternion_.E2.86.92_Euler_angles_.28z-y.E2.80.99-x.E2.80.B3_intrinsic.29
// -1 multiplication to make PYR angle directions same as angular velocity directions.
function getPYRAngles(rotation: Quaternion): RcsControlParams {
    const r = rotation;
    return {
        roll: -1 * Math.atan2(2*(r.w*r.x + r.y*r.z), 1 - 2*(Math.pow(r.x, 2) + Math.pow(r.y, 2))),
        pitch: -1 * Math.asin(2*(r.w*r.y - r.z*r.x)),
        yaw: -1 * Math.atan2(2*(r.w*r.z + r.x*r.y), 1 - 2*(Math.pow(r.y, 2) + Math.pow(r.z, 2)))
    };
}

/**
 * Transforms a vector into the rocket's body coordinates.
 */
function transformToBodyCoordinates(worldVector: Vec3): Vec3 {
    // Instead of rotating the body coordinate axes and transforming worldVector
    // into that system we can just rotate the world round the rocket in the opposite
    // direction.
    const worldRotation = rocketState.rotation.inverse();
    const worldVectorAsQuaternion = new Quaternion(worldVector.x, worldVector.y, worldVector.z, 0);
    const rotatedWorldAsQuaternion = worldRotation.mult(worldVectorAsQuaternion).mult(worldRotation.inverse());
    return new Vec3(rotatedWorldAsQuaternion.x, rotatedWorldAsQuaternion.y, rotatedWorldAsQuaternion.z);
}

function initControls(): void {
    KEY_CODE_TO_MANUAL_CONTROL['w'] = CONTROL_NAMES.YAW_LEFT;
    KEY_CODE_TO_MANUAL_CONTROL[87] = CONTROL_NAMES.YAW_LEFT;
    KEY_CODE_TO_MANUAL_CONTROL['s'] = CONTROL_NAMES.YAW_RIGHT;
    KEY_CODE_TO_MANUAL_CONTROL[83] = CONTROL_NAMES.YAW_RIGHT;
    KEY_CODE_TO_MANUAL_CONTROL['a'] = CONTROL_NAMES.PITCH_UP;
    KEY_CODE_TO_MANUAL_CONTROL[65] = CONTROL_NAMES.PITCH_UP;
    KEY_CODE_TO_MANUAL_CONTROL['d'] = CONTROL_NAMES.PITCH_DOWN;
    KEY_CODE_TO_MANUAL_CONTROL[68] = CONTROL_NAMES.PITCH_DOWN;
    KEY_CODE_TO_MANUAL_CONTROL['k'] = CONTROL_NAMES.THRUST;
    KEY_CODE_TO_MANUAL_CONTROL[75] = CONTROL_NAMES.THRUST;

    KEY_CODE_TO_AUTO_CONTROL['o'] = CONTROL_NAMES.ORIENT_TO_MOON;
    KEY_CODE_TO_AUTO_CONTROL[79] = CONTROL_NAMES.ORIENT_TO_MOON;
    KEY_CODE_TO_AUTO_CONTROL['l'] = CONTROL_NAMES.STABILIZE_ROTATION;
    KEY_CODE_TO_AUTO_CONTROL[77] = CONTROL_NAMES.STABILIZE_ROTATION;

    Object.keys(CONTROL_NAMES).forEach(function (control) {
        controlState.active[CONTROL_NAMES[control]] = false;
    });
    controlState.active[CONTROL_NAMES.STABILIZE_ROTATION] = true;

    document.addEventListener('keydown', activateManualControl);
    document.addEventListener('keyup', deactivateManualControl);
    document.addEventListener('keypress', toggleAutoControl);
}

function activateManualControl(event: KeyboardEvent): void {
    const controlName = KEY_CODE_TO_MANUAL_CONTROL[event.key] || KEY_CODE_TO_MANUAL_CONTROL[event.keyCode];

    if (!controlName) return;

    controlState.active[controlName] = true;

    switch (controlName) {
        case CONTROL_NAMES.PITCH_UP:
            controlState.active[CONTROL_NAMES.PITCH_DOWN] = false;
            break;
        case CONTROL_NAMES.PITCH_DOWN:
            controlState.active[CONTROL_NAMES.PITCH_UP] = false;
            break;
        case CONTROL_NAMES.YAW_LEFT:
            controlState.active[CONTROL_NAMES.YAW_RIGHT] = false;
            break;
        case CONTROL_NAMES.YAW_RIGHT:
            controlState.active[CONTROL_NAMES.YAW_LEFT] = false;
            break;
    }
}

function deactivateManualControl(event: KeyboardEvent): void {
    const controlName = KEY_CODE_TO_MANUAL_CONTROL[event.key] || KEY_CODE_TO_MANUAL_CONTROL[event.keyCode];
    controlState.active[controlName] = false;
}

function toggleAutoControl(event: KeyboardEvent): void {
    const controlName = KEY_CODE_TO_AUTO_CONTROL[event.key] || KEY_CODE_TO_AUTO_CONTROL[event.keyCode];

    if (!controlName) return;

    controlState.active[controlName] = !controlState.active[controlName];
}