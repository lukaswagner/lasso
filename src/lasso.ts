import { vec2 } from 'gl-matrix';
import { BitArray } from './types/bitarray';
import { Box, boxToPath, isBox, Mask } from './types/mask';
import { Mode } from './types/mode';
import { Selection } from './types/selection';
import { Source } from './types/source';

export type Options = {
    mode?: Mode,
    source?: Source,
}

export class Lasso {
    protected _mode: Mode;
    protected _source: Source;
    protected _selection: BitArray;

    public constructor(options: Options) {
        this._mode = options.mode;
        this._source = options.source;
    }

    public setMode(mode: Mode): Lasso {
        this.mode = mode;
        return this;
    }

    public setSource(source: Source): Lasso {
        this.source = source;
        return this;
    }

    public add(mask: Mask): Lasso {
        if(isBox(mask)) mask = boxToPath(mask);
        return this;
    }

    public subtract(mask: Mask): Lasso {
        if(isBox(mask)) mask = boxToPath(mask);
        return this;
    }

    public sub = this.subtract;

    public reset(): Lasso {
        this._selection = new BitArray(this._source.length);
        return this;
    }

    public getSelection(): Selection {
        return this.selection;
    }

    public set mode(mode: Mode) {
        this._mode = mode;
    }

    public set source(source: Source) {
        this._source = source;
        this.reset();
    }

    public get selection(): Selection {
        return undefined;
    }
}
