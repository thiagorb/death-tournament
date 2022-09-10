import {
    Matrix3,
    matrixCreate,
    matrixScale,
    Vec2,
    vectorAdd,
    vectorCopy,
    vectorCreate,
    vectorMultiply,
    vectorNormalize,
    vectorPerpendicular,
    vectorSubtract,
} from './glm';
import * as fragmentShader from './shaders/fragment.frag';
import * as vertexShader from './shaders/vertex.vert';

let virtualScreenWidth = 0;
let virtualScreenHeight = 0;

export const getVirtualScreenWidth = () => virtualScreenWidth;
export const getVirtualScreenHeight = () => virtualScreenHeight;

const enum ProgramProperty {
    WebGL2Context,
    Program,
    Attributes,
    Uniforms,
}

const enum UniformsProperty {
    ViewTransform,
    ModelTransform,
    GlobalOpacity,
    Color,
}

const enum AttributesProperty {
    VertexPosition,
    VertexNormal,
}

export type Program = {
    [ProgramProperty.WebGL2Context]: WebGL2RenderingContext;
    [ProgramProperty.Program]: WebGLProgram;
    [ProgramProperty.Uniforms]: {
        [U in UniformsProperty]: WebGLUniformLocation;
    };
    [ProgramProperty.Attributes]: {
        [A in AttributesProperty]: number;
    };
};

export const glProgramCreate = (canvas: HTMLCanvasElement, virtualWidth: number, virtualHeight: number): Program => {
    const gl = canvas.getContext('webgl2', { antialias: false });
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    if (process.env.NODE_ENV !== 'production' && gl === null) {
        throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.');
    }

    const glProgram = gl.createProgram();
    gl.attachShader(glProgram, compileShader(gl, gl.VERTEX_SHADER, vertexShader.source));
    gl.attachShader(glProgram, compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader.source));
    gl.linkProgram(glProgram);

    gl.useProgram(glProgram);

    const modelTransform = gl.getUniformLocation(glProgram, vertexShader.modelTransformRenamed);
    gl.uniformMatrix3fv(modelTransform, false, matrixCreate());

    const viewTransform = gl.getUniformLocation(glProgram, vertexShader.viewTransformRenamed);
    const updateViewport = () => {
        const pixelSize = 1 / devicePixelRatio;
        // const pixelSize = 1;
        canvas.width = document.body.clientWidth / pixelSize;
        canvas.height = document.body.clientHeight / pixelSize;

        const canvasWidth = document.body.clientWidth / pixelSize;
        const canvasHeight = document.body.clientHeight / pixelSize;
        const vMinPx = Math.min(canvasWidth / virtualWidth, canvasHeight / virtualHeight);
        virtualScreenWidth = canvasWidth / vMinPx;
        virtualScreenHeight = canvasHeight / vMinPx;

        gl.viewport(0, 0, canvasWidth, canvasHeight);
        const matrix = matrixCreate();
        matrixScale(matrix, 2 / virtualScreenWidth, 2 / virtualScreenHeight);
        gl.uniformMatrix3fv(viewTransform, false, matrix);

        const screen = document.querySelector('#screen') as HTMLElement;
        screen.style.width = `${virtualScreenWidth}px`;
        screen.style.height = `${virtualScreenHeight}px`;
        screen.style.transform = `scale(${vMinPx * pixelSize})`;
    };
    addEventListener('resize', updateViewport);
    updateViewport();

    const program = {
        [ProgramProperty.WebGL2Context]: gl,
        [ProgramProperty.Program]: glProgram,
        [ProgramProperty.Uniforms]: {
            [UniformsProperty.ViewTransform]: viewTransform,
            [UniformsProperty.ModelTransform]: modelTransform,
            [UniformsProperty.GlobalOpacity]: gl.getUniformLocation(glProgram, fragmentShader.globalOpacityRenamed),
            [UniformsProperty.Color]: gl.getUniformLocation(glProgram, fragmentShader.colorRenamed),
        },
        [ProgramProperty.Attributes]: {
            [AttributesProperty.VertexPosition]: gl.getAttribLocation(glProgram, vertexShader.vertexPositionRenamed),
            [AttributesProperty.VertexNormal]: gl.getAttribLocation(glProgram, vertexShader.vertexNormalRenamed),
        },
    };

    glSetGlobalOpacity(program, 1);

    return program;
};

export const glSetGlobalOpacity = (program: Program, opacity: number) => {
    program[ProgramProperty.WebGL2Context].uniform1f(
        program[ProgramProperty.Uniforms][UniformsProperty.GlobalOpacity],
        opacity
    );
};

const compileShader = (
    gl: WebGL2RenderingContext,
    type: WebGL2RenderingContext['VERTEX_SHADER'] | WebGL2RenderingContext['FRAGMENT_SHADER'],
    source: string
): WebGLShader => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
};

export const glClear = (program: Program, clearColor: [number, number, number, number] = [0, 0, 0, 1]) => {
    program[ProgramProperty.WebGL2Context].clearColor(...clearColor);
    program[ProgramProperty.WebGL2Context].clear(program[ProgramProperty.WebGL2Context].COLOR_BUFFER_BIT);
};

const enum MeshProperty {
    VertexArrayObject,
    VerticesLength,
    DrawMode,
    Color,
}

export type Mesh = ReturnType<typeof glMeshCreate>;

export const glMeshCreate = (program: Program, vertices: Array<number>, indices: Array<number>, color: ColorRGB) => {
    const gl = program[ProgramProperty.WebGL2Context];
    const vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayObject);

    setArray(program, AttributesProperty.VertexPosition, vertices, 2);

    const edgeNormals = [];
    for (let i = 0; i < vertices.length; i += 2) {
        const p1 = vectorCreate(vertices[i], vertices[i + 1]);
        const next = (i + 2) % vertices.length;
        const p2 = vectorCreate(vertices[next], vertices[next + 1]);
        edgeNormals.push(vectorPerpendicular(vectorNormalize(vectorSubtract(p2, p1))));
    }

    const normals: number[] = [];
    const vLength = vertices.length / 2;
    for (let i = 0; i < vLength; i++) {
        const n1 = edgeNormals[(i - 1 + vLength) % vLength];
        const n2 = edgeNormals[i];
        const n = vectorMultiply(vectorAdd(vectorCopy(n1), n2), 0.5);
        normals.push(n[0], n[1]);
    }

    setArray(program, AttributesProperty.VertexNormal, normals, 2);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        [MeshProperty.VertexArrayObject]: vertexArrayObject,
        [MeshProperty.VerticesLength]: indices.length,
        [MeshProperty.DrawMode]: gl.TRIANGLES,
        [MeshProperty.Color]: new Float32Array(color),
    };
};

const glDrawLineStrip = (program: Program, vertices: Array<[number, number]>) => {
    const gl = program[ProgramProperty.WebGL2Context];
    setArray(program, AttributesProperty.VertexPosition, vertices.flat(), 2);

    gl.drawArrays(gl.LINE_STRIP, 0, vertices.length);
};

const corners = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
];
export const glDrawRect = (program: Program, position: Vec2, size: Vec2) => {
    const vertices = [];
    const colors = [];
    let i = corners.length;
    while (i--) {
        const v = corners[i];
        vertices.push([position[0] + size[0] * v[0], position[1] + size[1] * v[1]]);
        colors.push([1, 1, 1]);
    }

    glDrawLineStrip(program, vertices);
};

export const glDrawBoundingBox = (program: Program, position: Vec2, size: Vec2) => {
    glDrawRect(program, vectorCreate(position[0] - size[0] / 2, position[1]), size);
};

export type ColorRGB = [number, number, number];
export type ColorRGBA = [number, number, number, number];

const setArray = (program: Program, attribute: AttributesProperty, values: number[], fetchSize: number) => {
    const gl = program[ProgramProperty.WebGL2Context];
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
    const attributeLocation = program[ProgramProperty.Attributes][attribute];
    gl.vertexAttribPointer(attributeLocation, fetchSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attributeLocation);
};

export const glSetModelTransform = (program: Program, matrix: Matrix3) => {
    program[ProgramProperty.WebGL2Context].uniformMatrix3fv(
        program[ProgramProperty.Uniforms][UniformsProperty.ModelTransform],
        false,
        matrix
    );
};

export const glMeshDraw = (program: Program, mesh: Mesh) => {
    const gl = program[ProgramProperty.WebGL2Context];
    gl.bindVertexArray(mesh[MeshProperty.VertexArrayObject]);
    gl.uniform3fv(program[ProgramProperty.Uniforms][UniformsProperty.Color], mesh[MeshProperty.Color]);
    gl.drawElements(mesh[MeshProperty.DrawMode], mesh[MeshProperty.VerticesLength], gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
};
