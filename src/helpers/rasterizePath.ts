import { Path } from '../types/mask';
import { BoundingBox } from '../types/boundingBox';
import { BitArray } from '../lasso';
import { vec2 } from 'gl-matrix';
import { intersectLineSegments } from './intersectLineSegments';
import { getBoundingBox } from './getBoundingBox';

export type Bitmap = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    width: number;
    height: number;
    data: BitArray;
}

type Intersection = {
    x: number;
    index: number;
    start: vec2;
    end: vec2;
}

// based on http://alienryderflex.com/polygon_fill/
export function rasterizePath(path: Path): Bitmap {
    const bb = getBoundingBox(path);
    const x0 = bb.min.at(0) - 1;
    const y0 = bb.min.at(1) - 1;
    const x1 = bb.max.at(0) + 1;
    const y1 = bb.max.at(1) + 1;
    const width = x1 - x0;
    const height = y1 - y0;
    const bitCount = width * height;
    const data = new BitArray(bitCount);

    for(let y = y0; y <= y1; y++) {
        const intersections: number[] = [];

        const s1 = vec2.fromValues(x0, y);
        const e1 = vec2.fromValues(x1, y);

        for(let i = 0; i < path.length; i++) {
            const s2 = path[i];
            const e2 = path[(i + 1) % path.length];

            // can only intersect if both on different sides
            // LT instead of LE also helps with vertices on line
            const startSide = y < s2.at(1);
            const endSide = y < e2.at(1);
            if(startSide === endSide) continue;

            const intersection = intersectLineSegments(s1, e1, s2, e2);
            if(!intersection) continue;

            intersections.push(Math.round(intersection.at(0)));
        }

        intersections.sort((a, b) => a - b);

        if(intersections.length % 2 === 1)
            throw new Error("Expected even number of intersections.");

        for(let i = 0; i < intersections.length; i += 2) {
            const start = intersections[i];
            const end = intersections[i + 1];
            for(let x = start; x <= end; x++) {
                data.set((y - y0) * width + (x - x0));
            }
        }
    }

    return { x0, y0, x1, y1, width, height, data };
}
