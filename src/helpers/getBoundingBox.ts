import { vec2 } from 'gl-matrix';
import { BoundingBox } from '../types/boundingBox';
import { Path } from '../types/mask';

export function getBoundingBox(path: Path): BoundingBox {
    const min = vec2.fromValues(Number.MAX_VALUE, Number.MAX_VALUE);
    const max = vec2.fromValues(Number.MIN_VALUE, Number.MIN_VALUE);
    path.forEach((p) => {
        if (p[0] < min[0]) min[0] = p[0];
        if (p[1] < min[1]) min[1] = p[1];
        if (p[0] > max[0]) max[0] = p[0];
        if (p[1] > max[1]) max[1] = p[1];
    });
    return { min, max };
}
