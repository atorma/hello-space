import {WorldState, RocketState, PlanetState, FuelState} from './physics'
import {Vec3, Quaternion} from 'cannon';
import {rocketSize} from './constants';

export class InitialState {
    static create(): WorldState {
        return new WorldState(
            /* ROCKET */
            new RocketState(
                10,                                     // mass
                new Vec3(20 + rocketSize[0] / 2, 0, 0),  // position
                new Quaternion(0, 0, 0, 1),                // rotation
                new Vec3(0, 0, 0),                        // velocity
                new Vec3(0, 0, 0),                        // angular velocity
                false,                                  // exploded

                /* Fuel */
                new FuelState(
                    0.000005,                 // mass
                    95                       // volume
                )
            ),
            [
                /* EARTH */
                new PlanetState(
                    "Earth2",
                    5.9e12,                   // mass
                    20,                       // radius
                    new Vec3(0, 0, 0),          // position
                    new Quaternion(0, 0, 0, 1),  // rotation
                    new Vec3(0, 0, 0),          // velocity
                    new Vec3(0, 0, 0)           // angular velocity
                ),
                /* MOON */
                new PlanetState(
                    "Moon",
                    7.3e11,
                    5,
                    new Vec3(0, 300, 0),
                    new Quaternion(0, 0, 0, 1),
                    new Vec3(-10, 0, 0),
                    new Vec3(0, 0, 0)
                ),
                /* Halimaa */
                new PlanetState(
                    "Halimaa",
                    7.3e11,
                    80,
                    new Vec3(1500, 800, 0),
                    new Quaternion(0, 0, 0, 1),
                    new Vec3(-2, 0, 0),
                    new Vec3(0, 0, 0)
                ),
                /* Volcano */
                new PlanetState(
                    "Volcano",
                    7.3e11,
                    80,
                    new Vec3(1500, 500, 800),
                    new Quaternion(0, 0, 0, 1),
                    new Vec3(-15, 0, 0),
                    new Vec3(0, 0, 0)
                ),
                /* Ice */
                new PlanetState(
                    "Ice",
                    7.3e11,
                    80,
                    new Vec3(-1900, 1500, 400),
                    new Quaternion(0, 0, 0, 1),
                    new Vec3(-15, 0, 0),
                    new Vec3(0, 0, 0)
                )
            ]
        )
    }
}
