import { mat4, vec2, vec4 } from 'gl-matrix';
import { Source } from '../types/source';

export function mapTo2D(points: Source, matrix: mat4): vec2[] {
    if(window.verbose) {
        console.log('mapping to 2D');
        console.log('matrix:', matrix);
        console.log('input:', points);
    }

    const result: vec2[] = [];
    for (let i = 0; i < points.length; i++) {
        const p3 = points.at(i);
        const p4 = vec4.fromValues(p3[0], p3[1], p3[2], 1);
        vec4.transformMat4(p4, p4, matrix);
        const p2 = vec2.fromValues(p4[0] / p4[3], p4[1] / p4[3]);
        result.push(p2)
    }

    if(window.verbose) {
        console.log('output:', result);
    }

    return result;
}
