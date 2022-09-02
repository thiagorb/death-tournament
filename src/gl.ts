import {
    Matrix3,
    matrixCopy,
    matrixCreate,
    matrixMultiply,
    matrixRotate,
    matrixScale,
    matrixTranslate,
    Vec2,
    vectorAdd,
    vectorCopy,
    vectorCreate,
    vectorMultiply,
    vectorNormalize,
    vectorPerpendicular,
    vectorSubtract,
} from './glm';
import fragmentShaderCode from './shaders/fragment.glsl';
import vertexShaderCode from './shaders/vertex.glsl';

const enum ProgramProperty {
    WebGL2Context,
    Program,
    Attributes,
    Uniforms,
    ModelMatrixStack,
    MatrixUpdated,
    CurrentModelMatrix,
}

const enum UniformsProperty {
    ViewTransform,
    ModelTransform,
    CurrentTime,
    PerlinSampler,
}

const enum AttributesProperty {
    VertexPosition,
    VertexNormal,
    Color,
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
    [ProgramProperty.ModelMatrixStack]: Array<Matrix3>;
    [ProgramProperty.MatrixUpdated]: boolean;
    [ProgramProperty.CurrentModelMatrix]: number;
};

export const glProgramCreate = (canvas: HTMLCanvasElement): Program => {
    const gl = canvas.getContext('webgl2', { stencil: true, antialias: false });
    if (gl === null) {
        throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.');
    }

    gl.enable(gl.STENCIL_TEST);

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexShaderCode));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode));
    gl.linkProgram(program);

    gl.useProgram(program);
    const perlinSampler = gl.getUniformLocation(program, 'perlinSampler');
    gl.uniform1i(perlinSampler, 0);

    const modelTransform = gl.getUniformLocation(program, 'modelTransform');
    gl.uniformMatrix3fv(modelTransform, false, matrixCreate());

    const viewTransform = gl.getUniformLocation(program, 'viewTransform');
    const updateViewport = () => {
        const pixelSize = 1;
        canvas.width = document.body.clientWidth / pixelSize;
        canvas.height = document.body.clientHeight / pixelSize;

        gl.viewport(0, 0, canvas.width, canvas.height);
        const matrix = matrixCreate();
        matrixScale(matrix, 1, canvas.width / canvas.height);

        const zoom = (pixelSize * Math.min(canvas.width, canvas.height)) / 500000;
        matrixScale(matrix, zoom, zoom);
        gl.uniformMatrix3fv(viewTransform, false, matrix);
    };
    addEventListener('resize', updateViewport);
    updateViewport();

    return {
        [ProgramProperty.WebGL2Context]: gl,
        [ProgramProperty.Program]: program,
        [ProgramProperty.Uniforms]: {
            [UniformsProperty.ViewTransform]: viewTransform,
            [UniformsProperty.ModelTransform]: modelTransform,
            [UniformsProperty.CurrentTime]: gl.getUniformLocation(program, 'currentTime'),
            [UniformsProperty.PerlinSampler]: perlinSampler,
        },
        [ProgramProperty.Attributes]: {
            [AttributesProperty.VertexPosition]: gl.getAttribLocation(program, 'vertexPosition'),
            [AttributesProperty.VertexNormal]: gl.getAttribLocation(program, 'vertexNormal'),
            [AttributesProperty.Color]: gl.getAttribLocation(program, 'color'),
        },
        [ProgramProperty.ModelMatrixStack]: [...new Array(10)].map(() => matrixCreate()),
        [ProgramProperty.MatrixUpdated]: false,
        [ProgramProperty.CurrentModelMatrix]: 0,
    };
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
}

export type Mesh = {
    [MeshProperty.VertexArrayObject]: WebGLVertexArrayObject;
    [MeshProperty.VerticesLength]: number;
    [MeshProperty.DrawMode]: number;
};

export const glMeshCreate = (program: Program, vertices: Array<number>, color: ColorRGB): Mesh => {
    const gl = program[ProgramProperty.WebGL2Context];
    const vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayObject);

    setArray(program, AttributesProperty.VertexPosition, vertices, 2);
    setArray(
        program,
        AttributesProperty.Color,
        vertices.flatMap(v => color),
        3
    );

    const edgeNormals = [];
    for (let i = 0; i < vertices.length; i += 2) {
        const p1 = vectorCreate(vertices[i], vertices[i + 1]);
        const next = (i + 2) % vertices.length;
        const p2 = vectorCreate(vertices[next], vertices[next + 1]);
        edgeNormals.push(vectorPerpendicular(vectorNormalize(vectorSubtract(p2, p1))));
    }

    const normals: Vec2[] = [];
    const vLength = vertices.length / 2;
    for (let i = 0; i < vLength; i++) {
        const n1 = edgeNormals[(i - 1 + vLength) % vLength];
        const n2 = edgeNormals[i];
        const n = vectorMultiply(vectorAdd(vectorCopy(n1), n2), 0.5);
        normals.push(n);
    }

    setArray(program, AttributesProperty.VertexNormal, normals.flat(), 2);

    return [vertexArrayObject, vLength, gl.TRIANGLE_FAN];
};

const glDrawLineStrip = (program: Program, vertices: Array<[number, number]>, colors: Array<ColorRGB>) => {
    const gl = program[ProgramProperty.WebGL2Context];
    setArray(program, AttributesProperty.VertexPosition, vertices.flat(), 2);
    setArray(program, AttributesProperty.Color, colors.flat(), 3);

    updateCurrentMatrix(program);
    gl.drawArrays(gl.LINE_STRIP, 0, vertices.length);
};

const glDrawLines = (program: Program, vertices: Array<[number, number]>) => {
    const gl = program[ProgramProperty.WebGL2Context];
    setArray(program, AttributesProperty.VertexPosition, vertices.flat(), 2);
    setArray(program, AttributesProperty.Color, vertices.map(v => [1, 0, 0]).flat(), 3);

    updateCurrentMatrix(program);
    gl.drawArrays(gl.LINES, 0, vertices.length);
};

const corners = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
];
export const glDrawRect = (program: Program, position: [number, number], size: Vec2) => {
    const vertices = [];
    const colors = [];
    let i = corners.length;
    while (i--) {
        const v = corners[i];
        vertices.push([position[0] + size[0] * v[0], position[1] + size[1] * v[1]]);
        colors.push([1, 1, 1]);
    }

    glDrawLineStrip(program, vertices, colors);
};

export const glDrawBoundingBox = (program: Program, position: Vec2, size: Vec2) => {
    glDrawRect(program, [position[0] - size[0] / 2, position[1]], size);
};

export type ColorRGB = [number, number, number];

export const glModelPush = (program: Program) => {
    const current = program[ProgramProperty.CurrentModelMatrix];
    if (current === program[ProgramProperty.ModelMatrixStack].length - 1) {
        throw new Error('Model matrix stack overflow');
    }

    const stack = program[ProgramProperty.ModelMatrixStack];
    matrixCopy(stack[current + 1], stack[current]);
    program[ProgramProperty.CurrentModelMatrix]++;
};

export const glModelPop = (program: Program) => {
    const current = program[ProgramProperty.CurrentModelMatrix];
    if (current === 0) {
        throw new Error('Model matrix stack underflow');
    }

    program[ProgramProperty.CurrentModelMatrix]--;
    invalidateCurrentMatrix(program);
};

const invalidateCurrentMatrix = (program: Program) => {
    program[ProgramProperty.MatrixUpdated] = false;
};

const updateCurrentMatrix = (program: Program) => {
    if (program[ProgramProperty.MatrixUpdated]) {
        return;
    }

    program[ProgramProperty.MatrixUpdated] = true;
    program[ProgramProperty.WebGL2Context].uniformMatrix3fv(
        program[ProgramProperty.Uniforms][UniformsProperty.ModelTransform],
        false,
        program[ProgramProperty.ModelMatrixStack][program[ProgramProperty.CurrentModelMatrix]]
    );
};

export const glModelTranslate = (program: Program, x: number, y: number) => {
    const matrix = program[ProgramProperty.ModelMatrixStack][program[ProgramProperty.CurrentModelMatrix]];
    matrixTranslate(matrix, x, y);
    invalidateCurrentMatrix(program);
};

export const glModelTranslateVector = (program: Program, v: [number, number]) => glModelTranslate(program, v[0], v[1]);

export const glModelScale = (program: Program, x: number, y: number) => {
    const matrix = program[ProgramProperty.ModelMatrixStack][program[ProgramProperty.CurrentModelMatrix]];
    matrixScale(matrix, x, y);
    invalidateCurrentMatrix(program);
};

export const glModelRotate = (program: Program, angle: number) => {
    const matrix = program[ProgramProperty.ModelMatrixStack][program[ProgramProperty.CurrentModelMatrix]];
    matrixRotate(matrix, angle);
    invalidateCurrentMatrix(program);
};

export const glModelMultiply = (program: Program, matrix: Matrix3) => {
    const current = program[ProgramProperty.ModelMatrixStack][program[ProgramProperty.CurrentModelMatrix]];
    matrixMultiply(current, matrix, current);
    invalidateCurrentMatrix(program);
};

const setArray = (program: Program, attribute: AttributesProperty, values: number[], fetchSize: number) => {
    const gl = program[ProgramProperty.WebGL2Context];
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
    const attributeLocation = program[ProgramProperty.Attributes][attribute];
    gl.vertexAttribPointer(attributeLocation, fetchSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attributeLocation);
};

export const glMeshDraw = (program: Program, mesh: Mesh) => {
    const gl = program[ProgramProperty.WebGL2Context];
    gl.bindVertexArray(mesh[MeshProperty.VertexArrayObject]);

    gl.clear(gl.STENCIL_BUFFER_BIT);
    gl.colorMask(false, false, false, false);
    gl.stencilFunc(gl.ALWAYS, 1, 1);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);
    gl.stencilMask(1);

    updateCurrentMatrix(program);
    gl.drawArrays(mesh[MeshProperty.DrawMode], 0, mesh[MeshProperty.VerticesLength]);
    gl.colorMask(true, true, true, true);
    gl.stencilFunc(gl.EQUAL, 1, 1);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    gl.drawArrays(mesh[MeshProperty.DrawMode], 0, mesh[MeshProperty.VerticesLength]);

    gl.bindVertexArray(null);
};
