import {PIDController, AngularPIDController} from "./external/pid_controller";
import {RocketState} from "./external/physics";
import {Vec3, Quaternion} from 'cannon';
import {ROTATION_TO_CARTESIAN_AXIS} from "./control_constants";
import {getRocketNoseDirection} from "./orientation";

enum TargetType {
    none,
    angularVelocity,
    orientation
}

export interface RcsControlParams {
    roll: number;
    pitch: number;
    yaw: number;
}

export class RotationController {

    private orientationTarget: Vec3;
    private angularVelocityControllers = {
        x: new PIDController(5, 0, 0),
        y: new PIDController(5, 0, 0),
        z: new PIDController(5, 0, 0)
    };
    private angleController: AngularPIDController = new AngularPIDController(3, 0, 1); // Target always 0 to orient rocket to target point
    private targetType: TargetType = TargetType.none;

    constructor() {}

    /**
     * Computes rocket rcs parameters using the current target:
     * angular velocity, orientation, or none.
     *
     * @param rocketState
     * @return {RcsControlParams}
     */
    update(rocketState: RocketState): RcsControlParams {
        const rcsParams: RcsControlParams = {
            roll: 0,
            pitch: 0,
            yaw: 0
        };

        if (this.targetType === TargetType.none) {
            return rcsParams;
        }

        if (this.targetType === TargetType.orientation) {
            const rocketNoseDirection: Vec3 = getRocketNoseDirection(rocketState.rotation);
            const requiredRotation: Quaternion = new Quaternion();
            requiredRotation.setFromVectors(this.orientationTarget, rocketNoseDirection);
            const axisAndAngle = requiredRotation.toAxisAngle();
            const rotationAxis: Vec3 = axisAndAngle[0];
            const rotationAngle: number = axisAndAngle[1];
            const angularVelocityMultiplier: number = this.angleController.update(rotationAngle);
            const angularVelocityTarget: Vec3 = rotationAxis.mult(angularVelocityMultiplier);
            this.setAngularVelocityPidTarget(angularVelocityTarget);
        }

        Object.keys(rcsParams).forEach((rotationAxis) => {
            const cartesianAxis = ROTATION_TO_CARTESIAN_AXIS[rotationAxis];
            rcsParams[rotationAxis] = this.angularVelocityControllers[cartesianAxis].update(rocketState.angularVelocity[cartesianAxis]);
        });

        return rcsParams;
    }

    private reset(): void {
        this.orientationTarget = undefined;
        this.angleController.reset();
        Object.keys(this.angularVelocityControllers).forEach((axis) => {
            this.angularVelocityControllers[axis].reset();
        });
    }

    /**
     * Sets the given angular velocity as the control target.
     *
     * @param angularVelocity
     */
    setAngularVelocityTarget(angularVelocity: Vec3): void {
        if (!angularVelocity) {
            this.targetType = TargetType.none;
            return;
        }

        this.targetType = TargetType.angularVelocity;
        this.setAngularVelocityPidTarget(angularVelocity);
    }

    private setAngularVelocityPidTarget(target: Vec3): void {
        Object.keys(this.angularVelocityControllers).forEach((axis) => {
            this.angularVelocityControllers[axis].target = target[axis];
        });
    }

    /**
     * Sets the given orientation direction as the control target.
     *
     * @param orientationTarget
     */
    setOrientationTarget(orientationTarget: Vec3): void {
        if (!orientationTarget) {
            this.targetType = TargetType.none;
            return;
        }

        this.targetType = TargetType.orientation;
        this.orientationTarget = orientationTarget.clone();
    }
}