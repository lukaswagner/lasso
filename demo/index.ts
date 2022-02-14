import { Canvas, vec3 } from 'webgl-operate';
import { PointRenderer } from './renderer';
import { Lasso, ResultType, Shape } from '..';

const htmlCanvas = document.getElementById('canvas') as HTMLCanvasElement;
const options: WebGLContextAttributes = {};
const canvas = new Canvas(htmlCanvas, options);
const renderer = new PointRenderer();
canvas.renderer = renderer;

const numPoints = 1e5;
const points: vec3[] = [];
const rand = () => Math.random() * 2 - 1;
for(let i = 0; i < numPoints; i++) {
    points.push(vec3.fromValues(rand(), rand(), rand()))
}
renderer.points = points;

// collect ui elements
const move = document.getElementById('move') as HTMLDivElement;
const circle = document.getElementById('circle') as HTMLDivElement;
const box = document.getElementById('box') as HTMLDivElement;
const undo = document.getElementById('undo') as HTMLDivElement;
const redo = document.getElementById('redo') as HTMLDivElement;
const plus = document.getElementById('plus') as HTMLDivElement;
const minus = document.getElementById('minus') as HTMLDivElement;
const reset = document.getElementById('reset') as HTMLDivElement;
const upper = [move, circle, box];
const lower = [plus, minus];

// only highlight one in row
const onlyOne = (a: HTMLDivElement[]) =>
    a.forEach((d) => d.addEventListener('click', () => {
        a.forEach((d) => d.classList.remove('selected'));
        d.classList.add('selected')
    }));
onlyOne(upper);
onlyOne(lower);

// initialize lasso
const lasso = new Lasso({
    target: htmlCanvas,
    points,
    callback: (s: Uint8Array) => renderer.selected = s,
    resultType: ResultType.IntArray
});

move.addEventListener('click', () => {
    lower.forEach((d) => d.classList.add('d-none'));
    renderer.move = true;
    lasso.disable();
});

circle.addEventListener('click', () => {
    lower.forEach((d) => d.classList.remove('d-none'));
    renderer.move = false;
    lasso.matrix = renderer.viewProjection;
    lasso.enable(Shape.Free);
});

box.addEventListener('click', () => {
    lower.forEach((d) => d.classList.remove('d-none'));
    renderer.move = false;
    lasso.matrix = renderer.viewProjection;
    lasso.enable(Shape.Rect);
});

plus.addEventListener('click', () => lasso.defaultModeIsAdd = true);
minus.addEventListener('click', () => lasso.defaultModeIsAdd = false);

reset.addEventListener('click', () => lasso.reset());
undo.addEventListener('click', () => lasso.undo());
redo.addEventListener('click', () => lasso.redo());

// initialize
move.click();
plus.click();
