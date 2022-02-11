import { mat4 } from 'gl-matrix';
import { BitArray } from './types/bitarray';
import { Callback } from './types/callback';
import { boxToPath, isBox, Mask } from './types/mask';
import { Options } from './types/options';
import { ResultType } from './types/resultType';
import { Selection } from './types/selection';
import { Source } from './types/source';
import { Step, StepType } from './types/step';

export class Lasso {
    protected _resultType: ResultType;
    protected _points: Source;
    protected _target: HTMLElement;
    protected _matrix: mat4;
    protected _callback: Callback;

    protected _selection: BitArray;
    protected _steps: Step[] = [];
    protected _step: number = 0

    protected apply(step: Step): void {
    }

    public constructor(options?: Options) {
        this._resultType = options?.resultType ?? ResultType.IntArray;
        this._points = options?.points;
        this._target = options?.target;
        this._matrix = options?.matrix ?? mat4.create();
        this._callback = options?.callback;
    }

    //#region configuration
    public setResultType(resultType: ResultType): Lasso {
        this.resultType = resultType;
        return this;
    }

    public set resultType(resultType: ResultType) {
        this._resultType = resultType;
    }

    public setPoints(points: Source): Lasso {
        this.points = points;
        return this;
    }

    public set points(points: Source) {
        this._points = points;
        this.reset();
    }

    public setTarget(target: HTMLElement): Lasso {
        this.target = target;
        return this;
    }

    public set target(target: HTMLElement) {
        this._target = target;
    }

    public setMatrix(matrix: mat4): Lasso {
        this.matrix = matrix;
        return this;
    }

    public set matrix(matrix: mat4) {
        this._matrix = matrix;
    }

    public setCallback(callback: Callback): Lasso {
        this.callback = callback;
        return this;
    }

    public set callback(callback: Callback) {
        this._callback = callback;
    }
    //#endregion configuration

    //#region main interface
    public enable(): void {
    }
    public start = this.enable;

    public disable(): void {
    }
    public stop = this.disable;

    public reset(): Lasso {
        this._selection = new BitArray(this._points.length);
        this._steps.push({ type: StepType.Rst });
        return this;
    }

    public redo(): boolean {
        if(this._step === this._steps.length - 1) return false;
        const step = this._steps[++this._step];
        this.apply(step);
        return true;
    }
    public forward = this.redo;
    public fwd = this.redo;

    public undo(): boolean {
        if(this._step === 0) return false;
        let step = this._steps[++this._step];
        switch (step.type) {
            case StepType.Add:
                this.apply(Object.assign({}, step, { type: StepType.Sub }));
                break;
            case StepType.Sub:
                this.apply(Object.assign({}, step, { type: StepType.Add }));
                break;
            case StepType.Rst:
                let start = 0;
                for (let i = this._step - 1; i >= 0; i--) {
                    if (this._steps[i].type === StepType.Rst) {
                        start = i;
                        break;
                    }
                }
                for (let i = start; i < this._step; i++) {
                    this.apply(this._steps[i]);
                }
                break;
            default:
                break;
        }
        return true;
    }
    public rewind = this.undo;
    public rwd = this.undo;
    public back = this.undo;
    //#endregion main interface

    //#region auxiliary interface
    public add(mask: Mask): Lasso {
        if(isBox(mask)) mask = boxToPath(mask);
        this._steps.push({
            type: StepType.Add,
            matrix: this._matrix,
            mask
        });
        return this;
    }

    public subtract(mask: Mask): Lasso {
        if(isBox(mask)) mask = boxToPath(mask);
        this._steps.push({
            type: StepType.Sub,
            matrix: this._matrix,
            mask
        });
        return this;
    }
    public sub = this.subtract;

    public getSelection(): Selection {
        return this.selection;
    }

    public get selection(): Selection {
        return undefined;
    }
    //#endregion auxiliary interface
}
