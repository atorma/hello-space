import {WorldState, PlanetState} from "./external/physics";
import {Vec3, Quaternion} from 'cannon';
import {rotate} from "./orientation";

export function predictMoonPosition(world: WorldState, time: number): Vec3 {
    const moon: PlanetState = world.planetStates.find(p => p.name === 'Moon');
    const earth: PlanetState = world.planetStates.find(p => p.name === 'Earth2');

    // Assuming perfect circular motion of the Moon around the Earth
    const r: Vec3 = moon.position.vsub(earth.position);
    const w: Vec3 = r.cross(moon.velocity).mult(1 / r.norm2());
    const rPredicted: Vec3 = circularMotion(r, w, time);
    const predicted: Vec3 = earth.position.vadd(rPredicted);
    return predicted;
}

/**
 * Computes position of rotating point from rotation axis after given time
 *
 * @param distanceFromRotationAxis
 * @param angularVelocity
 * @param time
 * @return {Vec3}
 */
export function circularMotion(distanceFromRotationAxis: Vec3, angularVelocity: Vec3, time: number): Vec3 {
    const rotationAngle: number = angularVelocity.norm() * time;
    const rotationAxis: Vec3 = angularVelocity.clone();
    rotationAxis.normalize(); // Must normalize the axis, otherwise we get very wrong results
    const rotation: Quaternion = new Quaternion();
    rotation.setFromAxisAngle(rotationAxis, rotationAngle);
    return rotate(distanceFromRotationAxis, rotation);
}