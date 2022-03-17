import { Canvas, vec3 } from 'webgl-operate';
import { PointRenderer } from './renderer';
import { Lasso, ResultType, Shape } from '..';

// renderer setup
const htmlCanvas = document.getElementById('canvas') as HTMLCanvasElement;
const options: WebGLContextAttributes = {};
const canvas = new Canvas(htmlCanvas, options);
const renderer = new PointRenderer();
canvas.renderer = renderer;

// create random points
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
    drawPath: true
});

// move button enables renderer movement controls and disables lasso
move.addEventListener('click', () => {
    lower.forEach((d) => d.classList.add('d-none'));
    renderer.move = true;
    lasso.disable();
});

// lasso select button disables renderer movement controls and enables lasso
circle.addEventListener('click', () => {
    lower.forEach((d) => d.classList.remove('d-none'));
    renderer.move = false;
    // matrix must be updated to allow correct mapping of 3D points to screen
    lasso.matrix = renderer.viewProjection;
    lasso.enable(Shape.Lasso);
});

// box select button disables renderer movement controls and enables lasso
box.addEventListener('click', () => {
    lower.forEach((d) => d.classList.remove('d-none'));
    renderer.move = false;
    // matrix must be updated to allow correct mapping of 3D points to screen
    lasso.matrix = renderer.viewProjection;
    lasso.enable(Shape.Box);
});

// modify default add/sub behavior (shift can be used to invert as well)
plus.addEventListener('click', () => lasso.defaultModeIsAdd = true);
minus.addEventListener('click', () => lasso.defaultModeIsAdd = false);

// enable reset/undo/redo functionality
reset.addEventListener('click', () => lasso.reset());
undo.addEventListener('click', () => lasso.undo());
redo.addEventListener('click', () => lasso.redo());

// initialize
move.click();
plus.click();
