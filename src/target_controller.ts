import {RotationController} from "./rcs_pid_control";
import {Vec3} from 'cannon';
import {ControlParams, RocketState} from "./external/physics";
import {getRocketNoseDirection} from "./orientation";
import {VelocityController} from "./velocity_controller";

export class TargetController {
    public static MIN_DOT_PRODUCT_FOR_ORIENTATION: number = 0.95;
    public static MIN_DOT_PRODUCT_FOR_HEADING: number = 0.95;

    private targetPoint: Vec3;
    private targetVelocity: number;
    private orientationController: RotationController = new RotationController();
    private velocityController: VelocityController = new VelocityController(0);

    public setTarget(targetPoint: Vec3, targetVelocity: number) {
        this.targetPoint = targetPoint;
        this.targetVelocity = targetVelocity;

        if (this.targetPoint) {
            this.orientationController.setOrientationTarget(this.targetPoint);
        }
        this.velocityController = new VelocityController(targetVelocity);
    }

    public update(rocket: RocketState): ControlParams {
        if (!this.targetPoint || !rocket) {
            return {};
        }

        const controlParams: ControlParams = {
            thrust: 0,
            rcs: this.orientationController.update(rocket)
        };

        const targetFromRocket: Vec3 = this.targetPoint.vsub(rocket.position);
        const targetDirection: Vec3 = targetFromRocket.clone();
        targetDirection.normalize();

        const rocketNoseDirection: Vec3 = getRocketNoseDirection(rocket.rotation);
        const rocketVelocityDirection: Vec3 = rocket.velocity.clone();
        rocketVelocityDirection.normalize();

        const orientationDotProduct: number = targetDirection.dot(rocketNoseDirection);
        const headingDotProduct: number = targetDirection.dot(rocketVelocityDirection);

        if (orientationDotProduct < TargetController.MIN_DOT_PRODUCT_FOR_ORIENTATION) {
            // Need to orient to target before applying thrust
            controlParams.thrust = 0;
        } else if (headingDotProduct < TargetController.MIN_DOT_PRODUCT_FOR_HEADING) {
            // Orientation is correct but heading is not, apply thrust to change heading
            controlParams.thrust = 1;
        } else {
            // Orientation and heading are correct, maintain velocity
            controlParams.thrust = this.velocityController.update(rocket).thrust;
        }

        return controlParams;
    }
}