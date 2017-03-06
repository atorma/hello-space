import {InitialState} from './external/initialstate';
import {WorldState} from './external/physics';

export function createWorldStateWithRocketOnly(): WorldState {
    const fullWorldState: WorldState = InitialState.create();
    const rocketOnlyState = new WorldState(fullWorldState.rocket, []);
    return rocketOnlyState;
}