import { vec3 } from 'gl-matrix';
import { BitArray } from './bitarray';

export type SelectionMap = Array<boolean> | Uint8Array | BitArray;
export type SelectionSet = Set<number> | Set<vec3>;
export type Selection = SelectionMap | SelectionSet;
