import {RunPhysics, Controls, WorldState, PlanetState} from "./external/physics";
import {InitialState} from "./external/initialstate";
import {Vec3} from "cannon";
import {predictMoonPosition} from "./moon_position";
import {Gravitation} from "./external/formulas";
import {createPlanetRigidBody} from "./helpers.spec";
import Constants = require("./physical_constants");

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

describe('predictMoonPosition()', () => {

    let world: WorldState;
    let moon: PlanetState;
    let earth: PlanetState;

    function getPlanet(name: string): PlanetState {
        return world.planetStates.find(p => p.name == name);
    }

    function updateStates() {
        earth = getPlanet('Earth2');
        moon = getPlanet('Moon');
    }

    beforeEach(() => {
        world = InitialState.create();
        updateStates();
    });

    it('predicts the Moon\'s position at given time from current state', () => {
        const moonInitialPosition: Vec3 = moon.position;
        const time: number = 50;
        const moonPrediction: Vec3 = predictMoonPosition(world, time);

        for (let i = 0; i * Constants.timeStep < time; i++) {
            world = RunPhysics(world, new Controls({}));
            updateStates();
        }

        const errorDistance: number = moon.position.distanceTo(moonPrediction);
        const travelDistance: number = moon.position.distanceTo(moonInitialPosition);
        expect(errorDistance/travelDistance).toBeLessThan(0.06);
    });

});
