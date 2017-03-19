import {RunPhysics, Controls, WorldState, PlanetState, RocketState} from "./external/physics";
import {InitialState} from "./external/initialstate";
import {goToMoon} from "./go_to_moon";
import Constants = require("./physical_constants");

describe('goToMoon()', () => {

    let world: WorldState;
    let moon: PlanetState;
    let earth: PlanetState;
    let rocket: RocketState;
    let distanceToMoon: number;
    let distanceToEarth: number;

    function getPlanet(name: string): PlanetState {
        return world.planetStates.find(p => p.name == name);
    }

    function updateStates() {
        earth = getPlanet('Earth2');
        moon = getPlanet('Moon');
        rocket = world.rocket;
        distanceToMoon = moon.position.vsub(rocket.position).norm() - moon.radius;
        distanceToEarth = earth.position.vsub(rocket.position).norm() - earth.radius;
    }

    beforeEach(() => {
        world = InitialState.create();
        updateStates();
    });

    it('drives to rocket to the moon', () => {
        const initialFuel: number = rocket.fuel.volume;

        for (let i = 0; i < 5000 && !world.rocket.exploded && distanceToMoon > 0; i++) {
            const controls: Controls = goToMoon(world);
            world = RunPhysics(world, controls);
            updateStates();
        }

        expect(rocket.exploded).toBe(false);
        expect(rocket.fuel.volume).toBeGreaterThan(0);
        expect(distanceToMoon).toBeLessThanOrEqual(Constants.rocketSize[0]);
        console.log('Exploded: ' + rocket.exploded);
        console.log('Distance to moon: ' + distanceToMoon);
        console.log('Fuel left: ' + (rocket.fuel.volume / initialFuel * 100) + '%');
    });

});