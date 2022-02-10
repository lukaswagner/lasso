import { vec2 } from 'gl-matrix';

export type Path = vec2[];
export type Box = { x: number, y: number, width: number, height: number };
export type Mask = Path | Box;

export function isBox(object: any): object is Box {
    return 'x' in object && 'y' in object &&
        'width' in object && 'height' in object;
}

export function boxToPath(box: Box): Path {
    return [
        [box.x, box.y],
        [box.x + box.width, box.y],
        [box.x + box.width, box.y + box.height],
        [box.x, box.y + box.height],
    ]
}
