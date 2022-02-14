import { vec2 } from 'gl-matrix';

export function mapToPixels(points: vec2[], resolution: vec2): vec2[] {
    if(window.verbose) {
        console.log('mapping to pixels');
        console.log('resolution:', resolution);
        console.log('input:', points);
    }

    const result = points.map((p) => {
        const v = vec2.create();
        vec2.scaleAndAdd(v, [0.5, 0.5], p, 0.5);
        vec2.mul(v, v, resolution);
        return v;
    });

    if(window.verbose) {
        console.log('output:', result);
    }

    return result;
}
