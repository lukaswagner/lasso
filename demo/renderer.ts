import {
    Buffer,
    Camera,
    Context,
    DefaultFramebuffer,
    EventProvider,
    Invalidate,
    mat4,
    Navigation,
    Program,
    Renderer,
    Shader,
    vec3,
} from 'webgl-operate';

export class PointRenderer extends Renderer {
    protected _gl: WebGL2RenderingContext;

    protected _fbo: DefaultFramebuffer;

    protected _camera: Camera;
    protected _navigation: Navigation;
    protected _move: boolean;

    protected _program: Program;
    protected _viewProjection: WebGLUniformLocation;

    protected _positions: Buffer;
    protected _numPoints: number;

    protected onInitialize(
        context: Context, invalidate: Invalidate, eventProvider: EventProvider
    ): boolean {
        this._gl = context.gl;

        this._fbo = new DefaultFramebuffer(context);
        this._fbo.initialize();

        this._camera = new Camera();
        this._camera.center = [0, 0, 0];
        this._camera.up = [0, 1, 0];
        this._camera.eye = [0, 0, 3];
        this._camera.near = 0.1;
        this._camera.far = 20;
        this._camera.fovy = 75;

        this._navigation = new Navigation(invalidate, eventProvider);
        this._navigation.camera = this._camera;
        // @ts-expect-error: webgl-operate mouse wheel zoom is broken
        this._navigation._wheelZoom = { process: () => { } };

        const vert = new Shader(context, this._gl.VERTEX_SHADER);
        vert.initialize(require('./point.vert'));
        const frag = new Shader(context, this._gl.FRAGMENT_SHADER);
        frag.initialize(require('./point.frag'));
        this._program = new Program(context);
        this._program.initialize([vert, frag]);

        this._viewProjection = this._program.uniform('u_viewProjection');

        this._positions = new Buffer(context);
        this._positions.initialize(this._gl.ARRAY_BUFFER);
        this._positions.attribEnable(0, 3, this._gl.FLOAT);

        return true;
    }

    protected onUninitialize(): void {
    }

    protected onDiscarded(): void {
    }

    protected onUpdate(): boolean {
        if(this._move) this._navigation.update();
        return this._camera.altered;
    }

    protected onPrepare(): void {
        if (this._altered.canvasSize) {
            this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];
        }
    }

    protected onFrame(): void {
        this._gl.viewport(0, 0, ...this._fbo.size);

        this._fbo.clear(
            this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT, true, false);

        this._gl.drawBuffers([ this._gl.BACK ]);

        this._program.bind();
        this._positions.bind();

        this._gl.uniformMatrix4fv(
            this._viewProjection, false, this._camera.viewProjection);

        this._gl.drawArrays(this._gl.POINTS, 0, this._numPoints);

        this._positions.unbind();
        this._program.unbind();
    }

    public set points(points: vec3[]) {
        const buf = new Float32Array(points.length * 3);
        points.forEach((p, i) => buf.set(p, i * 3));
        this._positions.data(new Float32Array(buf), this._gl.STATIC_DRAW);
        this._numPoints = points.length;
    }

    public set move(move: boolean) {
        this._move = move;
    }

    public get viewProjection(): mat4 {
        return this._camera.viewProjection;
    }
}
