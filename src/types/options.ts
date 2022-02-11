import { mat4 } from 'gl-matrix';
import { Callback } from './callback';
import { ResultType } from './resultType';
import { Source } from './source';

export type Options = {
    resultType?: ResultType,
    points?: Source,
    target?: HTMLElement,
    matrix?: mat4,
    callback?: Callback
}
