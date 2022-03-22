import { mat4, vec2, vec3 } from 'gl-matrix';
import { BitArray } from './types/bitArray';
import { Callback } from './types/callback';
import { Listeners } from './types/listeners';
import { boxToPath, isBox, Mask, Path } from './types/mask';
import { Options } from './types/options';
import { ResultType } from './types/resultType';
import { Selection } from './types/selection';
import { Source } from './types/source';
import { Step, StepType } from './types/step';
import { MatrixCache, ResolutionCache } from './types/cache';
import { mapTo2D } from './helpers/mapTo2D';
import { applyInsideCheck } from './helpers/applyInsideCheck';
import { mapToPixels } from './helpers/mapToPixels';
import { Shape } from './types/shape';
import { PathStyle } from './types/pathStyle';
import { applyImageBasedCheck } from './helpers/applyImageBasedCheck';
import { Algorithm } from './types/algorithm';
import { lookup } from './lookup/lookup';

export class Lasso {
    protected _resultType: ResultType;
    protected _points: Source;
    protected _target: HTMLElement;
    protected _matrix: mat4;
    protected _callback: Callback;
    protected _defaultModeIsAdd = true;
    protected _invertModifiers: string[] = ['Shift'];
    protected _drawPath: boolean;
    protected _pathStyle: PathStyle;
    protected _algorithm: Algorithm;
    protected _shape: Shape = Shape.Lasso;

    protected _mCache: MatrixCache;
    protected _rCache: ResolutionCache;
    protected _selection: BitArray;
    protected _steps: Step[] = [];
    protected _step: number = -1;

    protected _currentPath: vec2[];
    protected _listeners: Listeners;
    protected _pathCanvas: HTMLCanvasElement;
    protected _pathContext: CanvasRenderingContext2D;

    /**
     * Create and initialize lasso instance.
     * @param options See configuration functions for available options.
     */
    public constructor(options?: Options) {
        if(options?.verbose) this.verbose = true;
        this._resultType = options?.resultType ?? ResultType.ByteArray;
        this._points = options?.points;
        this._target = options?.target;
        this._matrix = options?.matrix ?? mat4.create();
        this._callback = options?.callback;
        if (options?.defaultModeIsAdd !== undefined)
            this._defaultModeIsAdd = options?.defaultModeIsAdd;
        const mod = options?.invertModifiers;
        if (mod) this._invertModifiers = Array.isArray(mod) ? mod : [mod];
        if(options?.drawPath !== undefined) {
            this.drawPath = options?.drawPath;
        }
        this._algorithm = options?.algorithm ?? Algorithm.Auto;
        if(this._points) this.reset();
    }

    //#region internal
    protected accessLookup(pathLength: number) {
        const pixel = this._target.clientWidth * this._target.clientHeight;
        if(window.verbose)
            console.log('lookup', this._points.length, pathLength, pixel);
        const lookupResult = lookup(this._points.length, pathLength, pixel);
        if(window.verbose) console.table(lookupResult);
        const algo = lookupResult
            .sort((a, b) => a.value - b.value)[0].algorithm;
        return algo;
    }

    protected getAlgorithm(pathLength: number) {
        switch (this._algorithm) {
            // threshold approximated by testing - should run precise perf test
            case Algorithm.Auto:
                if(window.verbose) console.time('lookup');
                const algo = this.accessLookup(pathLength);
                if(window.verbose) console.timeEnd('lookup');
                if(window.verbose) console.log('better algorithm: ' + algo);
                return algo === Algorithm.Image ?
                    applyImageBasedCheck : applyInsideCheck;
            case Algorithm.Polygon:
                return applyInsideCheck;
            case Algorithm.Image:
                return applyImageBasedCheck;
            default:
                console.error('Invalid algorithm: ' + this._algorithm)
                return undefined;
        }
    }

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

        if(window.verbose) console.time('apply');
        switch (step.type) {
            case StepType.Add:
                this.getAlgorithm(step.mask.length)(
                    this._rCache.points, step.mask, this._selection, true);
                break;
            case StepType.Sub:
                this.getAlgorithm(step.mask.length)(
                    this._rCache.points, step.mask, this._selection, false);
                break;
            case StepType.Rst:
                this._selection = new BitArray(this._points.length);
                break;
            default:
                break;
        }
        if(window.verbose) console.timeEnd('apply');

        this._callback?.(this.selection);
    }

    protected enqueueStep(step: Step) {
        if(this._step === this._steps.length - 1) this._steps.push(step);
        else this._steps.splice(
            this._step + 1, this._steps.length - this._step, step)
    }

    protected chooseAddSub(ev: MouseEvent, mask: Mask) {
        let add = this._defaultModeIsAdd;
        if(this._invertModifiers.every((m) => ev.getModifierState(m)))
            add = !add;
        if(add) this.add(mask);
        else this.sub(mask);
    }

    protected prepareCanvas() {
        if (!this._pathCanvas) {
            this._pathCanvas = document.createElement('canvas');
            document.body.appendChild(this._pathCanvas);
            this._pathCanvas.style.position = 'absolute';
            this._pathCanvas.style.pointerEvents = 'none';
            this._pathContext = this._pathCanvas.getContext('2d');
        }
        this._pathCanvas.style.left = this._target.clientLeft + 'px';
        this._pathCanvas.style.top = this._target.clientTop + 'px';
        this._pathCanvas.width = this._target.clientWidth;
        this._pathCanvas.height = this._target.clientHeight;
    }

    protected drawLine(start: vec2, ...points: vec2[]) {
        if(this._pathStyle) {
            // setting this in prepare doesn't seem to work properly
            this._pathContext.strokeStyle = this._pathStyle.style;
            this._pathContext.lineWidth = this._pathStyle.width;
        }
        const y = this._pathCanvas.height;
        this._pathContext.beginPath();
        this._pathContext.moveTo(start.at(0), y - start.at(1));
        points.forEach((p) => this._pathContext.lineTo(p.at(0), y - p.at(1)));
        this._pathContext.stroke();
    }

    protected enableFree() {
        const pos = (ev: MouseEvent) =>
            vec2.fromValues(ev.x, this._target.clientHeight - ev.y);
        const down = (ev: MouseEvent) => {
            if(this._drawPath) this.prepareCanvas();
            this._currentPath = [ pos(ev) ];
        }
        const move = (ev: MouseEvent) => {
            if(!this._currentPath) return;
            this._currentPath.push(pos(ev));
            if(this._drawPath) this.drawLine(
                this._currentPath[this._currentPath.length - 2],
                this._currentPath[this._currentPath.length - 1]);
        }
        const up = async (ev: MouseEvent) => {
            this.chooseAddSub(ev, this._currentPath);
            this._currentPath = undefined;
            if(this._drawPath) this._pathContext.clearRect(
                0, 0, this._pathCanvas.width, this._pathCanvas.height);
        }
        this._target.addEventListener('mousedown', down);
        this._target.addEventListener('mousemove', move);
        this._target.addEventListener('mouseup', up);
        this._listeners = { down, move, up };
    }

    protected enableRect() {
        const pos = (ev: MouseEvent) =>
            vec2.fromValues(ev.x, this._target.clientHeight - ev.y);
        const down = (ev: MouseEvent) => {
            if(this._drawPath) this.prepareCanvas();
            this._currentPath = [ pos(ev) ];
        }
        const move = (ev: MouseEvent) => {
            if(!this._currentPath) return;
            const s = this._currentPath[0];
            const e = pos(ev);
            this._pathContext.clearRect(
                0, 0, this._pathCanvas.width, this._pathCanvas.height);
            this.drawLine(s, [s.at(0), e.at(1)], e, [e.at(0), s.at(1)], s);
        }
        const up = (ev: MouseEvent) => {
            const p = this._currentPath;
            this._currentPath = undefined;
            const start = p[0];
            const size = vec2.sub(vec2.create(), pos(ev), start);
            this.chooseAddSub(ev, {
                x: start[0], y: start[1],
                width: size[0], height: size[1]
            });
            if(this._drawPath) this._pathContext.clearRect(
                0, 0, this._pathCanvas.width, this._pathCanvas.height);
        }
        this._target.addEventListener('mousedown', down);
        if(this._drawPath) this._target.addEventListener('mousemove', move);
        this._target.addEventListener('mouseup', up);
        this._listeners = { down, move, up };
    }
    //#endregion internal

    //#region configuration
    /**
     * Set the format for returned results. Possible values:
     * - booleanArray: `Array<boolean>`,
     * mapping each index to whether the point is selected.
     * - byteArray: An `Uint8Array`, mapping each index to either 0 or 1,
     * where 1 means the point is selected.
     * - bitArray: Most compact map option. Stores each point's selection state in a single bit.
     * - indexSet: Set of indices of selected points.
     * - bitArray: Set of selected points.
     * @param resultType String, specifying the desired result format.
     * @returns The Lasso instance.
     */
    public setResultType(resultType: ResultType): Lasso {
        this.resultType = resultType;
        return this;
    }

    /**
     * @see {@link setResultType}
     */
    public set resultType(resultType: ResultType) {
        this._resultType = resultType;
    }

    /**
     * Set the source providing the 3D points to be selected.
     * @param points The points. Must support `.length` and `.at(index)`.
     * @returns The Lasso instance.
     */
    public setPoints(points: Source): Lasso {
        this.points = points;
        this._steps = [];
        this._step = -1;
        this.reset();
        return this;
    }

    /**
     * @see {@link setPoints}
     */
    public set points(points: Source) {
        this._points = points;
        this.reset();
    }

    /**
     * Set the target for mouse events.
     * This will probably be a canvas on which you're rendering the points.
     * @param target An HTMLElement.
     * @returns The Lasso instance.
     */
    public setTarget(target: HTMLElement): Lasso {
        this.target = target;
        return this;
    }

    /**
     * @see {@link setTarget}
     */
    public set target(target: HTMLElement) {
        this._target = target;
    }

    /**
     * Set the transformation matrix for mapping the 3D to to 2D as displayed
     * on the target element.
     * Usually, this will be your combined model/view/projection matrix.
     * @param matrix 4x4 transformation matrix.
     * @returns The Lasso instance.
     */
    public setMatrix(matrix: mat4): Lasso {
        this.matrix = matrix;
        return this;
    }

    /**
     * @see {@link setMatrix}
     */
    public set matrix(matrix: mat4) {
        this._matrix = matrix;
    }

    /**
     * Set the callback which will be invoked when the selection changes.
     * The parameters for the function depend on the configured result type.
     * @param callback The callback function.
     * @returns The Lasso instance.
     */
    public setCallback(callback: Callback): Lasso {
        this.callback = callback;
        return this;
    }

    /**
     * @see {@link setCallback}
     */
    public set callback(callback: Callback) {
        this._callback = callback;
    }

    /**
     * Enable/disable verbose logging.
     * @param verbose Wether verbose logging should be enabled.
     * @returns The Lasso instance.
     */
    public setVerbose(verbose: boolean): Lasso {
        this.verbose = verbose;
        return this;
    }

    /**
     * @see {@link setVerbose}
     */
    public set verbose(verbose: boolean) {
        window.verbose = verbose;
    }

    /**
     * Set whether the default selection mode is addition. Enabled by default.
     * The mode can be inverted using the modifier keys set with
     * @see {@link setInvertModifiers}
     * @param add Wether the default selection mode is addition.
     * @returns The Lasso instance.
     */
    public setDefaultModeIsAdd(add: boolean): Lasso {
        this.defaultModeIsAdd = add;
        return this;
    }

    /**
     * @see {@link setDefaultModeIsAdd}
     */
    public set defaultModeIsAdd(add: boolean) {
        this._defaultModeIsAdd = add;
    }

    /**
     * Enable/disable/configure visualization of the currently drawn selection.
     * @param path Boolean for enable/disable or object containing `style` and `width` for detailed configuration.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/strokeStyle}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineWidth}
     * @returns The Lasso instance.
     */
    public setDrawPath(path: boolean | PathStyle): Lasso {
        this.drawPath = path;
        return this;
    }

    /**
     * @see {@link setDrawPath}
     */
    public set drawPath(path: boolean | PathStyle) {
        this._drawPath = !!path;
        if(path === undefined || typeof path === 'boolean')
            this._pathStyle = undefined;
        else
            this._pathStyle = path;
        if(!this._drawPath) {
            if(this._pathContext) {
                this._pathContext = undefined;
            }
            if(this._pathCanvas) {
                this._pathCanvas.remove();
                this._pathCanvas = undefined;
            }
        }
    }

    /**
     * Set modifier keys for inverting the default selection mode.
     * Note that all modifier keys have to be pressed to invert.
     * @param modifiers String or array of strings containing key codes
     * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState available key codes
     * @returns The Lasso instance.
     */
    public setInvertModifiers(modifiers: string | string[]): Lasso {
        this.invertModifiers = modifiers;
        return this;
    }

    /**
     * @see {@link setInvertModifiers}
     */
    public set invertModifiers(modifiers: string | string[]) {
        this._invertModifiers =
            modifiers instanceof Array ? modifiers : [modifiers];
    }

    /**
     * Configure whether points are selected using a point-in-polygon check or
     * an image-based check (rasterize path, check if pixel is filled).
     * By default, the faster algorithm is chosen based on the input data.
     * @param algorithm May be `polygon`, `image` or `auto`.
     * @returns The Lasso instance.
     */
    public setAlgorithm(algorithm: Algorithm): Lasso {
        this.algorithm = algorithm;
        return this;
    }

    /**
     * @see {@link setInvertModifiers}
     */
    public set algorithm(algorithm: Algorithm) {
        this._algorithm = algorithm;
    }
    //#endregion configuration

    //#region main interface
    /**
     * Start listening to mouse events.
     * Make sure `target`, `points` and `matrix` are set correctly.
     * @param shape `lasso` or `box`. Defaults to last shape, `lasso` initially.
     * @returns The Lasso instance.
     */
    public enable(shape: Shape = this._shape): Lasso {
        if (this._listeners && shape === this._shape) return this;
        if (this._shape && shape !== this._shape) this.disable();
        this._shape = shape;
        switch (this._shape) {
            case Shape.Lasso:
                this.enableFree();
                break;
            case Shape.Box:
                this.enableRect();
                break;
            default:
                break;
        }
        return this;
    }
    /**
     * @see {@link enable}
     */
    public start = this.enable;

    /**
     * Stop listening to mouse events.
     * @returns The Lasso instance.
     */
    public disable(): Lasso {
        if (!this._listeners) return this;
        this._target.removeEventListener('mousedown', this._listeners.down);
        if(this._listeners.move)
            this._target.removeEventListener('mousemove', this._listeners.move);
        this._target.removeEventListener('mouseup', this._listeners.up);
        this._listeners = undefined;
        return this;
    }
    /**
     * @see {@link disable}
     */
    public stop = this.disable;

    /**
     * Reset the selection.
     * @returns The Lasso instance.
     */
    public reset(): Lasso {
        this._steps.push({ type: StepType.Rst });
        this.redo();
        return this;
    }

    /**
     * Redo the last un-done action.
     * @returns The Lasso instance.
     */
    public redo(): boolean {
        if(this._step === this._steps.length - 1) return false;
        const step = this._steps[++this._step];
        this.apply(step);
        return true;
    }
    /**
     * @see {@link redo}
     */
    public forward = this.redo;
    /**
     * @see {@link redo}
     */
    public fwd = this.redo;

    /**
     * Undo the last action.
     * @returns The Lasso instance.
     */
    public undo(): boolean {
        if(this._step === 0) return false;
        let step = this._steps[this._step--];
        switch (step.type) {
            case StepType.Add:
                this.apply(Object.assign({}, step, { type: StepType.Sub }));
                break;
            case StepType.Sub:
                this.apply(Object.assign({}, step, { type: StepType.Add }));
                break;
            case StepType.Rst:
                let start = 0;
                for (let i = this._step; i >= 0; i--) {
                    if (this._steps[i].type === StepType.Rst) {
                        start = i;
                        break;
                    }
                }
                for (let i = start; i <= this._step; i++) {
                    this.apply(this._steps[i]);
                }
                break;
            default:
                break;
        }
        return true;
    }
    /**
     * @see {@link undo}
     */
    public rewind = this.undo;
    /**
     * @see {@link undo}
     */
    public rwd = this.undo;
    /**
     * @see {@link undo}
     */
    public back = this.undo;
    //#endregion main interface

    //#region auxiliary interface
    /**
     * Manually add a mask to the selection.
     * @param mask lasso path or box specifying the mask.
     * @returns The Lasso instance.
     */
    public add(mask: Mask): Lasso {
        if(isBox(mask)) mask = boxToPath(mask);
        this.enqueueStep({
            type: StepType.Add,
            matrix: this._matrix,
            mask
        });
        this.redo();
        return this;
    }

    /**
     * Manually subtract a mask from the selection.
     * @param mask lasso path or box specifying the mask.
     * @returns The Lasso instance.
     */
    public subtract(mask: Mask): Lasso {
        if(isBox(mask)) mask = boxToPath(mask);
        this.enqueueStep({
            type: StepType.Sub,
            matrix: this._matrix,
            mask
        });
        this.redo();
        return this;
    }
    /**
     * @see {@link subtract}
     */
    public sub = this.subtract;

    /**
     * Fetch the selection. Returned type based on @see {@link setResultType}.
     * @returns The selection.
     */
    public getSelection(): Selection {
        return this.selection;
    }

    /**
     * @see {@link getSelection}
     */
    public get selection(): Selection {
        if(!this._selection) return undefined;
        switch (this._resultType) {
            case ResultType.BooleanArray: {
                const result = new Array<boolean>(this._selection.length);
                for(let i = 0; i < this._selection.length; i++)
                    result[i] = this._selection.get(i);
                return result;
            }
            case ResultType.ByteArray: {
                const result = new Uint8Array(this._selection.length);
                for(let i = 0; i < this._selection.length; i++)
                    result[i] = +this._selection.get(i);
                return result;
            }
            case ResultType.BitArray: {
                return this._selection.clone();
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

    /**
     * Override the current selection.
     * @param selection `BitArray` mask specifying which points are selected.
     */
    public setSelection(selection: BitArray): void {
        this._selection = selection.clone();
    }
    //#endregion auxiliary interface
}

export { BitArray } from './types/bitArray';
export { Mask, Path, Box } from './types/mask';
export { Options } from './types/options';
export { PathStyle } from './types/pathStyle';
export { ResultType } from './types/resultType';
export { Shape } from './types/shape';
export { Algorithm } from './types/algorithm';
