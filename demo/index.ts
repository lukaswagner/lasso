import { Canvas, vec3 } from 'webgl-operate';
import { PointRenderer } from './renderer';

const htmlCanvas = document.getElementById('canvas') as HTMLCanvasElement;
const options: WebGLContextAttributes = {};
const canvas = new Canvas(htmlCanvas, options);
const renderer = new PointRenderer();
canvas.renderer = renderer;

const numPoints = 1e4;
const points: vec3[] = [];
const rand = () => Math.random() * 2 - 1;
for(let i = 0; i < numPoints; i++) {
    points.push(vec3.fromValues(rand(), rand(), rand()))
}
renderer.points = points;

// collect ui elements
const move = document.getElementById('move') as HTMLDivElement;
const lasso = document.getElementById('lasso') as HTMLDivElement;
const box = document.getElementById('box') as HTMLDivElement;
const plus = document.getElementById('plus') as HTMLDivElement;
const minus = document.getElementById('minus') as HTMLDivElement;
const reset = document.getElementById('reset') as HTMLDivElement;
const upper = [move, lasso, box];
const lower = [plus, minus, reset];

// only highlight one in row
const onlyOne = (a: HTMLDivElement[]) =>
    a.forEach((d) => d.addEventListener('click', () => {
        a.forEach((d) => d.classList.remove('selected'));
        d.classList.add('selected')
    }));
onlyOne(upper);
onlyOne(lower);

// hide lower row while moving, control camera movement
const modeSwitch = (move: boolean) => {
    lower.forEach((d) => d.classList[move ? 'add' : 'remove']('d-none'));
    renderer.move = move;
}
move.addEventListener('click', modeSwitch.bind(undefined, true));
lasso.addEventListener('click', modeSwitch.bind(undefined, false));
box.addEventListener('click', modeSwitch.bind(undefined, false));

// initialize
move.click();
plus.click();
