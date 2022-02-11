import { vec2 } from 'gl-matrix';
import { BitArray } from '../types/bitarray';
import { Path } from '../types/mask';
import { getBoundingBox } from './getBoundingBox';
import { pointInsidePolygon } from './pointInsidePolygon';

export function applyInsideCheck(
    points: vec2[], path: Path, selection: BitArray, value: boolean
): void {
    const bb = getBoundingBox(path);
    points.forEach((p, i) => {
        if (pointInsidePolygon(p, path, bb)) selection.set(i, value);
    });
}
