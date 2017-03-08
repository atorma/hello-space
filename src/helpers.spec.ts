import {RocketState, FuelState} from './external/physics';
import {Vec3, Quaternion} from 'cannon';
import {rocketSize} from './external/constants';

export interface RocketStateParams {
    mass?: number,
    position?: Vec3,
    rotation?: Quaternion,
    velocity?: Vec3,
    angularVelocity?: Vec3,
    exploded?: boolean,
    fuel?: FuelState
}

export function createRocketState(params: RocketStateParams): RocketState {
    return new RocketState(
        params.mass || 10,
        params.position || new Vec3(20 + rocketSize[0] / 2, 0, 0),
        params.rotation ||  new Quaternion(0, 0, 0, 1),
        params.velocity || new Vec3(0, 0, 0),
        params.angularVelocity || new Vec3(0, 0, 0),
        params.exploded || false,
        params.fuel || new FuelState(
            0.000005,                // mass
            95                       // volume
        )
    );
}