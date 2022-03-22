import { vec2 } from 'gl-matrix';
import { BitArray } from '../../types/bitArray';
import { Path } from '../../types/mask';
import { rasterizePath } from '../rasterizePath';

export function imageCheck(
    points: vec2[], path: Path, selection: BitArray, value: boolean
): void {
    if (window.verbose) {
        console.log('image based selection check');
        console.log('path:', path);
        console.log('input:', points);
    }

    const bmp = rasterizePath(path);
    points.forEach((p, i) => {
        const x = Math.round(p.at(0));
        const y = Math.round(p.at(1));
        const inside =
            x >= bmp.x0 && x <= bmp.x1 && y >= bmp.y0 && y<= bmp.y1 &&
            bmp.data.get((y - bmp.y0) * bmp.width + (x - bmp.x0));
        if (inside) selection.set(i, value);
    });
}
