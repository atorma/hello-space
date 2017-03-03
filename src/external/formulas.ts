import { Body, Vec3, Quaternion } from 'cannon'
import { gravitation, gravitationFalloff } from './constants'

export function Gravitation(body1: Body, body2: Body):[Vec3, Vec3] {
    const dist = body1.position.distanceTo(body2.position);
    const force = ((gravitation * body1.mass * body2.mass) / Math.pow(dist, gravitationFalloff));
    const forceV = (from: Body, to: Body, length: number) => from.position.vsub(to.position).unit().scale(length);
    return [
        forceV(body2, body1, force),
        forceV(body1, body2, force)
    ]
}

export function deg2rad(degrees: number):number {
    return degrees * (Math.PI / 180)
}
