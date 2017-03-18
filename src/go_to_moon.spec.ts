import {RunPhysics, Controls, WorldState, PlanetState, RocketState} from "./external/physics";
import {InitialState} from "./external/initialstate";
import {goToMoon} from "./go_to_moon";

xdescribe('goToMoon()', () => {

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
        for (let i = 0; i < 500 && !world.rocket.exploded; i++) {
            const controls: Controls = goToMoon(world);
            world = RunPhysics(world, controls);
            updateStates();
            console.log('Moon', distanceToMoon, 'Earth', distanceToEarth);
        }

        console.log('Exploded', rocket.exploded);
        expect(distanceToMoon).toBeLessThan(moon.radius + 5);
    });

});