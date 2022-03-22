import { Camera } from 'webgl-operate';
import { Algorithm, BitArray, Lasso, ResultType } from '..';
import { vec2, vec3 } from 'gl-matrix';

type Config = {
    points: number;
    path: number;
    resolution: number;
    algorithm: Algorithm;
    pass: number;
}

type Sample = Config & {
    time: number;
    selected: number;
}

function samples(min: number, max: number, count: number): number[] {
    const step = (max - min) / (count - 1);
    const samples = [min];
    for(let i = 1; i < count - 1; i++) samples.push(Math.round(min + i * step));
    samples.push(max);
    return samples;
}

const start = document.getElementById('start') as HTMLButtonElement;
const progressNumber = document.getElementById('progNum') as HTMLSpanElement;
const progressBar = document.getElementById('progBar') as HTMLProgressElement;

const points = samples(1e2, 1e5, 5)
    .map((v) => { return { points: v }});
const path = samples(1e1, 5e2, 5)
    .map((v) => { return { path: v }});
const resolution = samples(1e2, 1e3, 5)
    .map((v) => { return { resolution: v }});
const algorithm = [Algorithm.Polygon, Algorithm.Image]
    .map((v) => { return { algorithm: v }});
const warmupPasses = 0;
const benchmarkPasses = 1;
const passes: { pass: number }[] = [];
for(let i = -warmupPasses; i < 0; i++) passes.push({ pass: i });
for(let i = 0; i < benchmarkPasses; i++) passes.push({ pass: i });

const configs: Config[] = [{}]
    .map((c) => points.map((v) => Object.assign({}, c, v))).flat()
    .map((c) => path.map((v) => Object.assign({}, c, v))).flat()
    .map((c) => resolution.map((v) => Object.assign({}, c, v))).flat()
    .map((c) => algorithm.map((v) => Object.assign({}, c, v))).flat()
    .map((c) => passes.map((v) => Object.assign({}, c, v))).flat();

progressBar.max = configs.length - 1;
progressBar.value = 0;

function toCSV(data: Sample[]) {
    const keys = Object.keys(data[0]) as (keyof Sample)[];
    let str = keys.join(',') + '\n';
    for (const d of data) {
        keys.forEach((k, i, a) => {
            let s = d[k]?.toString() ?? '';
            if (s.includes(',')) {
                s = s.replaceAll('"', '\\"');
                s = '"' + s + '"';
            }
            str = str.concat(s);
            if (i < a.length - 1) str = str.concat(',');
        });
        str = str.concat('\n');
    }
    return str;
}

async function run() {
    const start = Date.now();
    const results: Sample[] = [];

    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const camera = new Camera();
    camera.center = [0, 0, 0];
    camera.up = [0, 1, 0];
    camera.eye = [0, 0, 3];
    camera.near = 0.1;
    camera.far = 20;
    camera.fovy = 75;

    for(let i = 0; i < configs.length; i++) {
        const config = configs[i];

        // apply resolution
        canvas.width = config.resolution;
        canvas.height = config.resolution;
        camera.viewport = [config.resolution, config.resolution];
        camera.aspect = config.resolution / config.resolution;

        // create random points
        const points: vec3[] = [];
        const rand = () => Math.random() * 2 - 1;
        for(let i = 0; i < config.points; i++) {
            points.push(vec3.fromValues(rand(), rand(), rand()))
        }

        // initialize lasso
        const lasso = new Lasso({
            target: canvas,
            points,
            matrix: camera.viewProjection,
            resultType: ResultType.BitArray,
            algorithm: config.algorithm,
        });

        // generate path
        const center = config.resolution / 2;
        const radius = config.resolution / 2 * 0.8;
        const angleStep = Math.PI * 2 / config.path;
        const path: vec2[] = [];
        for(let i = 0; i < config.path; i++) {
            const angle = i * angleStep;
            path.push(vec2.fromValues(
                center + radius * Math.cos(angle),
                center + radius * Math.sin(angle)));
        }

        const start = Date.now();
        lasso.add(path);
        const end = Date.now();

        const time = end - start;
        const result = lasso.selection as BitArray;
        let selected = 0;
        for(let i = 0; i < result.length; i++) {
            if(result.get(i)) selected++;
        }
        const selectedRatio = selected / config.points;

        const sample: Sample = Object.assign(
            {}, config, { time, selected });
        results.push(sample);

        const left =
            config.points.toString().padStart(6) + ' / ' +
            config.path.toString().padStart(3) + ' / ' +
            config.resolution.toString().padStart(4) + ' / ' +
            config.algorithm.padStart(7) + ' / ' +
            config.pass.toString().padStart(2);
        const right =
            sample.time.toString().padStart(4) + ' / ' +
            (selectedRatio * 100).toPrecision(4) + '%';
        console.log(left + ' -> ' + right);

        progressNumber.innerText = `${i + 1} / ${configs.length}`;
        progressBar.value = i;
        await new Promise((res) => setTimeout(res, 1));
    };

    canvas.remove();

    console.log(toCSV(results));
    const end = Date.now();
    console.log('Total time: ' + ((end - start) / 1000).toFixed(3) + 's');
}

start.onclick = run;
