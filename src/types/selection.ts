import { vec3 } from 'gl-matrix';

export type SelectionMap = Array<boolean> | Uint8Array;
export type SelectionSet = Set<number> | Set<vec3>;
export type Selection = SelectionMap | SelectionSet;
