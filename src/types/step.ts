import { mat4 } from 'gl-matrix';
import { Path } from './mask';

export enum StepType {
    Add,
    Sub,
    Rst
}

export type Step = {
    type: StepType,
    matrix?: mat4,
    mask?: Path
}
