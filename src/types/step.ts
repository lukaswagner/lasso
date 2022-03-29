import { mat4 } from 'gl-matrix';
import { BitArray } from './bitArray';
import { Mask } from './mask';

export enum StepType {
    Add,
    Sub,
    Rst
}

export type Step = {
    type: StepType,
    matrix?: mat4,
    mask?: Mask,
    state?: BitArray
}
