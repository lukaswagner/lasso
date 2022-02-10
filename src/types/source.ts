import { vec3 } from 'gl-matrix';

export interface Source {
    at(index: number): vec3;
    length: number;
}
