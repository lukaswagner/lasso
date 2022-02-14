import { vec2 } from 'gl-matrix';
import { BoundingBox } from '../types/boundingBox';
import { Path } from '../types/mask';
import { intersectLineSegments } from './intersectLineSegments';

export function pointInsidePolygon(
    point: vec2, polygon: Path, bb: BoundingBox
): boolean {
    const s1 = vec2.add(vec2.create(), bb.min, [-1, -1]);
    let inside = false;
    for(let i = 0; i < polygon.length; i++) {
        const s2 = polygon[i];
        const e2 = polygon[(i + 1) % polygon.length];
        if (intersectLineSegments(s1, point, s2, e2)) {
            inside = !inside;
        }
    }
    return inside;
}
