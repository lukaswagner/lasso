import { Algorithm } from '../types/algorithm';

type Header = {
    points: number[],
    path: number[],
    pixel: number[],
    algorithm: Algorithm[]
};

type PerfValue = {
    algorithm: Algorithm,
    value: number
};

const header = JSON.parse(require('../lookup/lookupHeader.json')) as Header;
const data = new Uint8Array(require('../lookup/lookupData.bin').data);

const offsets = {
    pixel:
        header.algorithm.length,
    path:
        header.algorithm.length * header.pixel.length,
    points:
        header.algorithm.length * header.pixel.length * header.path.length
}

function getIndices(
    property: 'points' | 'path' | 'pixel', value: number
): [number, number] {
    let upper = header[property].findIndex((v) => v > value);
    let lower: number;
    if (upper === -1)
        lower = upper = header[property].length - 1;
    else
        lower = Math.max(upper - 1, 0);
    return [lower, upper];
}

function sample(poIdx: number, paIdx: number, piIdx: number): PerfValue[] {
    const offset =
        poIdx * offsets.points + paIdx * offsets.path + piIdx * offsets.pixel;
    return header.algorithm.map((algorithm, i) => {
        return { algorithm, value: data[offset + i] };
    });
}

function interpolate(
    inEdges: number[], inValue: number,
    outLower: PerfValue[], outUpper: PerfValue[]
): PerfValue[] {
    const div = inEdges[1] - inEdges[0];
    if(div === 0) return outLower;
    const t = (inValue - inEdges[0]) / div;
    return header.algorithm.map((algorithm, i) => {
        return {
            algorithm,
            value: outLower[i].value * (1 - t) + outUpper[i].value * t
        }
    });
}

/**
 * Sample lookup table using trilinear filtering.
 */
export function lookup(
    points: number, path: number, pixel: number
): PerfValue[] {
    const poIdx = getIndices('points', points);
    const paIdx = getIndices('path', path);
    const piIdx = getIndices('pixel', pixel);

    const poIn = poIdx.map((v) => header.points[v]);
    const piIn = piIdx.map((v) => header.pixel[v]);
    const paIn = paIdx.map((v) => header.path[v]);

    const samples3d = [
        sample(poIdx[0], paIdx[0], piIdx[0]),
        sample(poIdx[0], paIdx[0], piIdx[1]),
        sample(poIdx[0], paIdx[1], piIdx[0]),
        sample(poIdx[0], paIdx[1], piIdx[1]),
        sample(poIdx[1], paIdx[0], piIdx[0]),
        sample(poIdx[1], paIdx[0], piIdx[1]),
        sample(poIdx[1], paIdx[1], piIdx[0]),
        sample(poIdx[1], paIdx[1], piIdx[1]),
    ];

    const samples2d: PerfValue[][] = [];
    for(let i = 0; i < samples3d.length; i += 2) {
        samples2d.push(interpolate(piIn, pixel, samples3d[i], samples3d[i+1]))
    }

    const samples1d: PerfValue[][] = [];
    for(let i = 0; i < samples2d.length; i += 2) {
        samples1d.push(interpolate(paIn, path, samples2d[i], samples2d[i+1]))
    }

    return interpolate(poIn, points, samples1d[0], samples1d[1]);
}
