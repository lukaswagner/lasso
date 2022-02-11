import { mat4, vec2 } from 'gl-matrix';

export type MatrixCache = {
    matrix: mat4;
    points: vec2[];
}

export type ResolutionCache = {
    resolution: vec2;
    points: vec2[];
}
