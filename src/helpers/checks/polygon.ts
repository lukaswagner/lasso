import { vec2 } from 'gl-matrix';
import { BitArray } from '../../types/bitArray';
import { Mask, isBox } from '../../types/mask';
import { getBoundingBox } from '../getBoundingBox';
import { pointInsidePolygon } from '../pointInsidePolygon';

export function polygonCheck(
    points: vec2[], mask: Mask, selection: BitArray, value: boolean
): void {
    if (isBox(mask)) throw new Error('Mask needs to be path.');

    if (window.verbose) {
        console.log('inside-out based selection check');
        console.log('path:', mask);
        console.log('input:', points);
    }

    const bb = getBoundingBox(mask);
    points.forEach((p, i) => {
        const inside = pointInsidePolygon(p, mask, bb);
        if (inside) selection.set(i, value);
    });
}
