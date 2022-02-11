import { vec2 } from 'gl-matrix';

export function mapToPixels(points: vec2[], resolution: vec2): vec2[] {
    return points.map((p) => vec2.mul(vec2.create(), p, resolution));
}
