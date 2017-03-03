import {RunPhysics, WorldState, Controls} from './external/physics';
import {InitialState} from './external/initialstate';

describe('test', () => {

    let worldState: WorldState;

    beforeEach(() => {
        worldState = InitialState.create();
    });

    // it('should run physics', () => {
    //     let controls = new Controls({
    //         thrust: 1,
    //         rcs: {
    //             roll: 1,
    //             pitch: 0,
    //             yaw: 0
    //         }
    //     });
    //
    //     for (let i = 0; i < 1000; i++) {
    //         worldState = RunPhysics(worldState, controls);
    //         console.log(worldState.rocket);
    //     }
    // });

    it('should fail', () => {
        expect(true).toBe(false);
    });
});