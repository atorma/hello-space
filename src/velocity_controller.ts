import {ControlParams, RocketState} from "./external/physics";
import {Vec3} from "cannon";
import {RotationController} from "./rcs_pid_control";
import {getAngleRadiansBetween, degreesToRadians, getRocketNoseDirection} from "./orientation";
import Constants = require("./physical_constants");

export class VelocityController {

    private targetVelocity: Vec3;
    private orientationController: RotationController = new RotationController();
    private allowedOrientationErrorRad: number = degreesToRadians(2);

    public setTarget(targetVelocity: Vec3) {
        this.targetVelocity = targetVelocity;
    }

    public update(rocket: RocketState): ControlParams {
        if (!this.targetVelocity) {
            return {};
        }

        const velocityDiff: Vec3 = this.targetVelocity.vsub(rocket.velocity);
        this.orientationController.setOrientationTarget(velocityDiff);

        const controlParams: ControlParams = {
            thrust: 0,
            rcs: undefined
        };
        controlParams.rcs = this.orientationController.update(rocket);

        const rocketNoseDirection: Vec3 = getRocketNoseDirection(rocket.rotation);
        const angleToOrientation: number = getAngleRadiansBetween(rocketNoseDirection, velocityDiff);
        if (angleToOrientation < this.allowedOrientationErrorRad) {
            // This would give velocityDiff in one time step: thrust = F/F_max = m*a/F_max = m*v_diff/t_step/F_max
            controlParams.thrust = velocityDiff.norm() / Constants.timeStep * rocket.mass / Constants.maxThrust;
        } else {
            // We wait for the rocket to re-orient
        }

        return controlParams;
    }


}
