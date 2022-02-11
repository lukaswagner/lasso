import { mat4, vec2, vec3 } from 'gl-matrix';
import { BitArray } from './types/bitarray';
import { Callback } from './types/callback';
import { Listeners } from './types/listeners';
import { boxToPath, isBox, Mask } from './types/mask';
import { Options } from './types/options';
import { ResultType } from './types/resultType';
import { Selection } from './types/selection';
import { Source } from './types/source';
import { Step, StepType } from './types/step';
import { MatrixCache, ResolutionCache } from './types/cache';
import { mapTo2D } from './helpers/mapTo2D';
import { applyInsideCheck } from './helpers/applyInsideCheck';
import { mapToPixels } from './helpers/mapToPixels';

export class Lasso {
    protected _resultType: ResultType;
    protected _points: Source;
    protected _target: HTMLElement;
    protected _matrix: mat4;
    protected _callback: Callback;

    protected _mCache: MatrixCache;
    protected _rCache: ResolutionCache;
    protected _selection: BitArray;
    protected _steps: Step[] = [];
    protected _step: number = -1;

    protected _currentPath: vec2[];
    protected _listeners: Listeners;

    protected apply(step: Step): void {
        let mCacheUpdated = false;
        if (this._mCache?.matrix !== this._matrix) {
            mCacheUpdated = true;
            this._mCache = {
                matrix: this._matrix,
                points: mapTo2D(this._points, this._matrix)
            }
        }

        const resolution = vec2.fromValues(
            this._target.clientWidth,this._target.clientHeight);
        if (
            this._rCache?.resolution[0] !== resolution[0] ||
            this._rCache?.resolution[1] !== resolution[1] ||
            mCacheUpdated
        ) {
            this._rCache = {
                resolution,
                points: mapToPixels(this._mCache.points, resolution)
            }
        }

        switch (step.type) {
            case StepType.Add:
                applyInsideCheck(
                    this._rCache.points, step.mask, this._selection, true);
                break;
            case StepType.Sub:
                applyInsideCheck(
                    this._rCache.points, step.mask, this._selection, false);
                break;
            case StepType.Rst:
                this._selection = new BitArray(this._points.length);
                break;
            default:
                break;
        }

        this._callback?.(this.selection);
    }

    public constructor(options?: Options) {
        this._resultType = options?.resultType ?? ResultType.BooleanArray;
        this._points = options?.points;
        this._target = options?.target;
        this._matrix = options?.matrix ?? mat4.create();
        this._callback = options?.callback;
        if(this._points) this.reset();
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
        this._steps = [];
        this._step = -1;
        this.reset();
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
    public enable(): Lasso{
        if (this._listeners) return this;
        const pos = (ev: MouseEvent) =>
            vec2.fromValues(ev.x, this._target.clientHeight - ev.y);
        const down = (ev: MouseEvent) => this._currentPath = [ pos(ev) ];
        const move =  (ev: MouseEvent) => this._currentPath?.push(pos(ev));
        const up = (ev: MouseEvent) => {
            this.add(this._currentPath);
        }
        this._target.addEventListener('mousedown', down);
        this._target.addEventListener('mousemove', move);
        this._target.addEventListener('mouseup', up);
        this._listeners = { down, move, up };
        return this;
    }
    public start = this.enable;

    public disable(): Lasso {
        if (!this._listeners) return this;
        this._target.removeEventListener('mousedown', this._listeners.down);
        this._target.removeEventListener('mousemove', this._listeners.move);
        this._target.removeEventListener('mouseup', this._listeners.up);
        this._listeners = undefined;
        return this;
    }
    public stop = this.disable;

    public reset(): Lasso {
        this._steps.push({ type: StepType.Rst });
        this.redo();
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
        this.redo();
        return this;
    }

    public subtract(mask: Mask): Lasso {
        if(isBox(mask)) mask = boxToPath(mask);
        this._steps.push({
            type: StepType.Sub,
            matrix: this._matrix,
            mask
        });
        this.redo();
        return this;
    }
    public sub = this.subtract;

    public getSelection(): Selection {
        return this.selection;
    }

    public get selection(): Selection {
        if(!this._selection) return undefined;
        switch (this._resultType) {
            case ResultType.BooleanArray: {
                const result = new Array<boolean>(this._selection.length);
                for(let i = 0; i < this._selection.length; i++)
                    result[i] = this._selection.get(i);
                return result;
            }
            case ResultType.IntArray: {
                const result = new Uint8Array(this._selection.length);
                for(let i = 0; i < this._selection.length; i++)
                    result[i] = +this._selection.get(i);
                return result;
            }
            case ResultType.PointSet: {
                const result = new Set<vec3>();
                for(let i = 0; i < this._selection.length; i++)
                    if (this._selection.get(i)) result.add(this._points.at(i));
                return result;
            }
            case ResultType.IndexSet: {
                const result = new Set<number>();
                for(let i = 0; i < this._selection.length; i++)
                    if (this._selection.get(i)) result.add(i);
                return result;
            }
            default:
                return undefined;
        }
    }
    //#endregion auxiliary interface
}
