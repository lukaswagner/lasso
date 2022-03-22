import { vec2 } from 'gl-matrix';
import { BitArray } from '../../types/bitArray';
import { Mask, isBox } from '../../types/mask';

export function boxCheck(
    points: vec2[], mask: Mask, selection: BitArray, value: boolean
): void {
    if (!isBox(mask)) throw new Error('Mask needs to be box.');

    if (window.verbose) {
        console.log('image based selection check');
        console.log('path:', mask);
        console.log('input:', points);
    }

    let x1 = mask.x + mask.width;
    let y1 = mask.y + mask.height;
    const x0 = Math.min(mask.x, x1);
    const y0 = Math.min(mask.y, y1);
    x1 = Math.max(mask.x, x1);
    y1 = Math.max(mask.y, y1);

    points.forEach((p, i) => {
        const inside = p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
        if (inside) selection.set(i, value);
    });
}
