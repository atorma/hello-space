import {WorldState, Controls, ControlParams, RocketState, PlanetState} from "./external/physics";
import {Vec3} from "cannon";
import {RotationController} from "./rcs_pid_control";
import {TargetController} from "./target_controller";

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

const rotationController: RotationController = new RotationController();
const targetController: TargetController = new TargetController();

let controlState = {
    active: {}
};

let rocket: RocketState;
let moon: PlanetState;
let earth: PlanetState;


initControls();

////////////// Functions //////////////

export function goToMoon(worldState): Controls {
    updateWorldStates(worldState);

    if (rocket.position.distanceTo(earth.position) + earth.radius < 50) {
        return new Controls({thrust: 1});
    } else {
        targetController.setTarget(moon.position, moon.velocity.norm() + 2);
        return new Controls(targetController.update(rocket));
    }

}

function updateWorldStates(worldState: WorldState): void {
    rocket = worldState.rocket;
    moon = worldState.planetStates.find(function (ps) {
        return ps.name === 'Moon';
    });
    earth = worldState.planetStates.find(function (ps) {
        return ps.name === 'Earth2';
    });
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

    if (controlState.active[CONTROL_NAMES.ORIENT_TO_MOON]) {
        const moonDirection: Vec3 = moon.position.vsub(rocket.position);
        rotationController.setOrientationTarget(moonDirection);
    } else if (controlState.active[CONTROL_NAMES.STABILIZE_ROTATION]) {
        rotationController.setAngularVelocityTarget(new Vec3(0, 0, 0));
    }
    controlParams.rcs = rotationController.update(rocket);

    applyManualControlParams(controlParams);

    return controlParams;
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