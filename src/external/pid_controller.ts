export class PIDController {
    private sumErr : number = 0;
    private lastErr: number = 0;
    target   : number = 0;

    constructor(readonly k_p: number = 1,
                readonly k_i: number = 0,
                readonly k_d: number = 0) {}

    calculateError(currentValue) {
        return (this.target - currentValue)
    }
    update(currentValue) {
        const err = this.calculateError(currentValue);
        this.sumErr = this.sumErr + err;

        const dErr = (err - this.lastErr);
        this.lastErr = err;

        return (this.k_p * err) +
            (this.k_i * this.sumErr) +
            (this.k_d * dErr)
    }

    reset() {
        this.sumErr  = 0;
        this.lastErr = 0
    }
}

export class AngularPIDController extends PIDController {
    calculateError(currentValue) {
        const error = (this.target - currentValue);
        if (error > Math.PI)
            return error - (Math.PI * 2);
        else if (error < Math.PI * -1)
            return error + (Math.PI * 2);
        else
            return error
    }
}