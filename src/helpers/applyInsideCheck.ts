import { vec2 } from 'gl-matrix';
import { BitArray } from '../types/bitArray';
import { Path } from '../types/mask';
import { getBoundingBox } from './getBoundingBox';
import { pointInsidePolygon } from './pointInsidePolygon';

export function applyInsideCheck(
    points: vec2[], path: Path, selection: BitArray, value: boolean
): void {
    if (window.verbose) {
        console.log('inside-out based selection check');
        console.log('path:', path);
        console.log('input:', points);
    }

    const bb = getBoundingBox(path);
    points.forEach((p, i) => {
        const inside = pointInsidePolygon(p, path, bb);
        if (inside) selection.set(i, value);
        if (window.verbose) console.log(p, inside ? 'is inside' : 'is outside');
    });
}
