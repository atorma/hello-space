import {ControlParams, RocketState} from "./external/physics";
import Constants = require("./physical_constants");
import {PIDController} from "./external/pid_controller";

export class VelocityController {

    private pidController: PIDController = new PIDController(3, 0, 0);

    constructor(targetVelocity: number) {
        this.pidController.target = targetVelocity;
    }

    public update(rocket: RocketState): ControlParams {
        const currentVelocity: number = rocket.velocity.norm();
        return {
            thrust: this.pidController.update(currentVelocity)
        };
    }
}
