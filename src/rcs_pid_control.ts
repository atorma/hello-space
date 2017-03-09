import {PIDController} from "./external/pid_controller";
import {RocketState} from "./external/physics";
import {Vec3} from 'cannon';
import {ROTATION_TO_CARTESIAN_AXIS} from "./constants";

enum TargetType {
    none,
    angularVelocity,
    orientation
}

export interface RcsControlParams {
    roll?: number;
    pitch?: number;
    yaw?: number;
}

export class RotationController {

    private angularVelocityControllers = {
        x: new PIDController(5, 0, 0),
        y: new PIDController(5, 0, 0),
        z: new PIDController(5, 0, 0)
    };
    private targetType: TargetType = TargetType.none;

    constructor() {}

    update(rocketState: RocketState): RcsControlParams {
        const rcsParams: RcsControlParams = {
            roll: 0,
            pitch: 0,
            yaw: 0
        };

        Object.keys(rcsParams).forEach((rotationAxis) => {
            const cartesianAxis = ROTATION_TO_CARTESIAN_AXIS[rotationAxis];
            rcsParams[rotationAxis] = this.angularVelocityControllers[cartesianAxis].update(rocketState.angularVelocity[cartesianAxis]);
        });

        return rcsParams;
    }

    private reset() {
        Object.keys(this.angularVelocityControllers).forEach((axis) => {
            this.angularVelocityControllers[axis].reset();
        });
    }

    setAngularVelocityTarget(target: Vec3) {
        this.targetType = TargetType.angularVelocity;
        this.reset();
        Object.keys(this.angularVelocityControllers).forEach((axis) => {
            this.angularVelocityControllers[axis].reset();
            this.angularVelocityControllers[axis].target = target[axis];
        });
    }

    setOrientationTarget(target: Vec3) {

    }
}