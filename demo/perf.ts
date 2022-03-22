import { Camera } from 'webgl-operate';
import { Algorithm, BitArray, Lasso, ResultType } from '..';
import { vec2, vec3 } from 'gl-matrix';

declare class Chart {
    constructor(elem: HTMLElement, conf: Object)
}

type Config = {
    points: number;
    path: number;
    width: number,
    height: number,
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

const points = [1e2, 5e2, 1e3, 5e3, 1e4, 5e4, 1e5, 5e5];
const path = [1e1, 25e0, 5e1, 1e2, 25e1, 5e2, 1e3];
const resolution = [
    [200, 200],
    [500, 500],
    [800, 600],
    [1280, 720],
    [1920, 1080],
    [2560, 1440],
    [3840, 2160]
];
const algorithm = [Algorithm.Polygon, Algorithm.Image];
const warmupPasses = 0;
const benchmarkPasses = 1;
const passes: { pass: number }[] = [];
for(let i = -warmupPasses; i < 0; i++) passes.push({ pass: i });
for(let i = 0; i < benchmarkPasses; i++) passes.push({ pass: i });

console.table(points);
console.table(path);
console.table(resolution);
console.table(
    'combinations: ' +
    (points.length * path.length * resolution.length * algorithm.length));

const configs: Config[] = [{}]
    .map((c) => points.map((v) => Object.assign({}, c,  { points: v })))
    .flat()
    .map((c) => path.map((v) => Object.assign({}, c, { path: v })))
    .flat()
    .map((c) => resolution.map((v) => Object.assign({}, c,
        { width: v.at(0), height: v.at(1) })))
    .flat()
    .map((c) => algorithm.map((v) => Object.assign({}, c, { algorithm: v })))
    .flat()
    .map((c) => passes.map((v) => Object.assign({}, c, v)))
    .flat();

progressBar.max = configs.length - 1;
progressBar.value = 0;

start.onclick = run;

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
        canvas.width = config.width;
        canvas.height = config.height;
        camera.viewport = [config.width, config.height];
        camera.aspect = config.width / config.height;

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
        const xCenter = config.width / 2;
        const xRadius = config.width / 2 * 0.8;
        const yCenter = config.height / 2;
        const yRadius = config.height / 2 * 0.8;
        const angleStep = Math.PI * 2 / config.path;
        const path: vec2[] = [];
        for(let i = 0; i < config.path; i++) {
            const angle = i * angleStep;
            path.push(vec2.fromValues(
                xCenter + xRadius * Math.cos(angle),
                yCenter + yRadius * Math.sin(angle)));
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
            config.points.toString().padStart(7) + ' / ' +
            config.path.toString().padStart(3) + ' / ' +
            config.width.toString().padStart(4) + ' / ' +
            config.height.toString().padStart(4) + ' / ' +
            config.algorithm.padStart(7) + ' / ' +
            config.pass.toString().padStart(2);
        const right =
            sample.time.toString().padStart(5) + ' / ' +
            (selectedRatio * 100).toPrecision(4) + '%';
        console.log(left + ' -> ' + right);

        progressNumber.innerText = `${i + 1} / ${configs.length}`;
        progressBar.value = i;
        await new Promise((res) => setTimeout(res, 1));
    };

    canvas.remove();

    const end = Date.now();
    console.log('Total time: ' + ((end - start) / 1000).toFixed(3) + 's');

    graph(results);
}

function graph(data: Sample[]) {
    const refPoints = 1e5;
    const refPath = 1e2;
    const refRes = [1920, 1080];

    const getData = (
        key: 'points' | 'path' | 'width',
        labels: number[],
        filter: (v: Sample) => boolean
    ) => {
        return algorithm.map((a, i) => {
            const m = new Map<number, { sum: number, count: number }>();
            data.filter((v) => filter(v) && v.algorithm === a
            ).forEach((s) => {
                const entry = m.get(s[key]) ?? { sum: 0, count: 0 };
                entry.sum += s.time;
                entry.count++;
                m.set(s[key], entry);
            });
            return {
                label: a,
                borderColor: ['red', 'blue'][i],
                data: labels.map((v) => m.get(v).sum / m.get(v).count)
            }
        });
    }

    const pointsDatasets = getData(
        'points',
        points,
        (v) => v.path === refPath && v.width === refRes.at(0)
    );
    new Chart(document.getElementById('chartPoints'), {
        type: 'line',
        data: { labels: points, datasets: pointsDatasets },
        options: {
            plugins: { title: { display: true, text:
                'selection time to number of points - \n' +
                `#vertices: ${refPath}, resolution: ${refRes.at(0)}x${refRes.at(1)}`
            }},
            scales: {
                x: { title: { display: true, text: 'number of points' }},
                y: { title: { display: true, text: 'time in ms' }}
            }
        }
    });

    const pathDatasets = getData(
        'path',
        path,
        (v) => v.points === refPoints && v.width === refRes.at(0)
    );
    new Chart(document.getElementById('chartPath'), {
        type: 'line',
        data: { labels: path, datasets: pathDatasets },
        options: {
            plugins: { title: { display: true, text:
                'selection time to number of path vertices - \n' +
                `#points: ${refPoints}, resolution: ${refRes.at(0)}x${refRes.at(1)}`
            }},
            scales: {
                x: { title: { display: true, text: 'number of path vertices' }},
                y: { title: { display: true, text: 'time in ms' }}
            }
        }
    });

    const resolutionLabels = resolution.map((v) => `${v.at(0)}x${v.at(1)}`);
    const resolutionDatasets = getData(
        'width',
        resolution.map((v) => v.at(0)),
        (v) => v.points === refPoints && v.path === refPath
    );
    new Chart(document.getElementById('chartResolution'), {
        type: 'line',
        data: { labels: resolutionLabels, datasets: resolutionDatasets },
        options: {
            plugins: { title: { display: true, text:
                'selection time to canvas resolution - \n' +
                `#points: ${refPoints}, #vertices: ${refPath}`
            }},
            scales: {
                x: { title: { display: true, text: 'canvas resolution' }},
                y: { title: { display: true, text: 'time in ms' }}
            }
        }
    });
}
