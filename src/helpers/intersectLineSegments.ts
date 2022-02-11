import { vec2 } from 'gl-matrix'

// https://stackoverflow.com/a/24392281
export function intersectLineSegments(s1: vec2, e1: vec2, s2: vec2, e2: vec2) {
    const det =
        (e1[0] - s1[0]) * (e2[1] - s2[1]) -
        (e2[0] - s2[0]) * (e1[1] - s1[1]);
    if (det === 0) {
        return false;
    } else {
        const lambda =
            ((e2[1] - s2[1]) * (e2[0] - s1[0]) +
            (s2[0] - e2[0]) * (e2[1] - s1[1])) / det;
        const gamma =
            ((s1[1] - e1[1]) * (e2[0] - s1[0]) +
            (e1[0] - s1[0]) * (e2[1] - s1[1])) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
}
