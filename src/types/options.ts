import { mat4 } from 'gl-matrix';
import { Algorithm } from './algorithm';
import { Callback } from './callback';
import { PathStyle } from './pathStyle';
import { ResultType } from './resultType';
import { Source } from './source';

export type Options = {
    verbose?: boolean,
    resultType?: ResultType,
    points?: Source,
    target?: HTMLElement,
    matrix?: mat4,
    callback?: Callback,
    defaultModeIsAdd?: boolean,
    invertModifiers?: string | string[],
    drawPath?: boolean | PathStyle,
    algorithm?: Algorithm,
}
