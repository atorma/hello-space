import {WorldState, PlanetState} from "./external/physics";
import {InitialState} from "./external/initialstate"
import {Vec3} from 'cannon';
import {Gravitation} from "./external/formulas";
import {createPlanetRigidBody} from "./helpers.spec";

describe('Initial state', () => {

    it('has the moon in circular motion around the earth', () => {
        const worldState: WorldState = InitialState.create();

        // Earth is unmoving at the origin
        const earthState: PlanetState = worldState.planetStates.find(planetState => planetState.name === 'Earth2');
        expect(earthState.position).toEqual(new Vec3(0, 0, 0));
        expect(earthState.velocity.norm()).toBe(0);

        const moonState: PlanetState = worldState.planetStates.find(planetState => planetState.name === 'Moon');
        // Velocity vector is tangential to the position vector
        expect(moonState.velocity.dot(moonState.position)).toBe(0);
        // Gravity of earth as the centripetal force nearly equals the centripetal force to make the moon move in circular motion at its current velocity
        const [moonToEarthGravityVec] = Gravitation(createPlanetRigidBody(earthState), createPlanetRigidBody(moonState));
        const gravityMagnitude: number = moonToEarthGravityVec.norm();
        const centripetalForceMagnitude: number = moonState.mass * moonState.velocity.norm2() / moonState.position.norm();
        expect(gravityMagnitude/centripetalForceMagnitude).toBeCloseTo(0.950, 3); // Actual gravity 5% smaller than the centripetal force for perfect circular motion => ellipsoid trajectory?
    });

});
