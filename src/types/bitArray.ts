export class BitArray {
    protected _length: number;
    protected _buffer: ArrayBuffer;
    protected _view: DataView;

    constructor(length: number, buffer?: ArrayBuffer) {
        this._length = length;
        this._buffer = buffer ?? new ArrayBuffer(Math.ceil(length / 8));
        this._view = new DataView(this._buffer);
    }

    get(index: number): boolean {
        if(index < 0 || index >= this._length) return undefined;
        const byte = Math.floor(index / 8);
        const bit = index % 8;
        const number = this._view.getUint8(byte);
        const mask = 1 << bit;
        return (number & mask) !== 0;
    }

    set(index: number, value: boolean = true): void {
        if(index < 0 || index >= this._length) return;
        const byte = Math.floor(index / 8);
        const bit = index % 8;
        let number = this._view.getUint8(byte);
        const mask = 1 << bit;
        if(value) number |= mask;
        else number &= ~mask;
        this._view.setUint8(byte, number);
    }

    public get length(): number {
        return this._length;
    }

    public clone(): BitArray {
        return new BitArray(this._length, this._buffer.slice(0));
    }
}
