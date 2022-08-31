import {
    Matrix3,
    matrixCopy,
    matrixCreate,
    matrixMultiply,
    matrixRotate,
    matrixScale,
    matrixTranslate,
    vectorNormalize,
    Vec2,
    vectorCopy,
    vectorCreate,
    vectorSubtract,
    vectorPerpendicular,
    vectorAdd,
    vectorMultiply,
} from './glm';
import fragmentShaderCode from './shaders/fragment.glsl';
import vertexShaderCode from './shaders/vertex.glsl';

const enum ProgramProperty {
    WebGL2Context,
    Program,
    Attributes,
    Uniforms,
    ModelMatrixStack,
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
    Color,
    Normal,
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
    [ProgramProperty.CurrentModelMatrix]: number;
};

export const glProgramCreate = (canvas: HTMLCanvasElement): Program => {
    const gl = canvas.getContext('webgl2', { stencil: true });
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
        gl.viewport(0, 0, canvas.width, canvas.height);
        const matrix = matrixCreate();
        matrixScale(matrix, 1, canvas.width / canvas.height);
        matrixScale(matrix, 0.002, 0.002);
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
            [AttributesProperty.Color]: gl.getAttribLocation(program, 'color'),
            [AttributesProperty.Normal]: gl.getAttribLocation(program, 'normal'),
        },
        [ProgramProperty.ModelMatrixStack]: [...new Array(10)].map(() => matrixCreate()),
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
    IndicesLength,
    DrawMode,
}

export type Mesh = {
    [MeshProperty.VertexArrayObject]: WebGLVertexArrayObject;
    [MeshProperty.IndicesLength]: number;
    [MeshProperty.DrawMode]: number;
};

const glMeshCreate = (program: Program, vertices: Vertex[], indices: number[]): Mesh => {
    const gl = program[ProgramProperty.WebGL2Context];
    const vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayObject);

    setArray(
        program,
        AttributesProperty.VertexPosition,
        vertices.flatMap(v => v[VertexProperty.Position]),
        2
    );
    setArray(
        program,
        AttributesProperty.Color,
        vertices.flatMap(v => v[VertexProperty.Color]),
        3
    );

    const edgeNormals = [];
    const vLength = vertices.length;
    for (let i = 0; i < vLength; i++) {
        const p1 = vertices[i][VertexProperty.Position];
        const p2 = vertices[(i + 1) % vLength][VertexProperty.Position];
        edgeNormals.push(vectorPerpendicular(vectorNormalize(vectorSubtract(vectorCopy(p2), p1))));
    }

    const normals: Vec2[] = [];
    for (let i = 0; i < vLength; i++) {
        const n1 = edgeNormals[(i - 1 + vLength) % vLength];
        const n2 = edgeNormals[i];
        const n = vectorMultiply(vectorAdd(vectorCopy(n1), n2), 0.5);
        normals.push(n);
    }

    setArray(program, AttributesProperty.Normal, normals.flat(), 2);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return [vertexArrayObject, indices.length, gl.TRIANGLE_FAN];
};

const glDrawLineStrip = (program: Program, vertices: Array<[number, number]>, colors: Array<ColorRGB>) => {
    const gl = program[ProgramProperty.WebGL2Context];
    setArray(program, AttributesProperty.VertexPosition, vertices.flat(), 2);
    setArray(program, AttributesProperty.Color, colors.flat(), 3);

    gl.disable(gl.STENCIL);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([...vertices.keys()]), gl.DYNAMIC_DRAW);
    gl.drawElements(gl.LINE_STRIP, vertices.length, gl.UNSIGNED_SHORT, 0);
};

const glDrawLines = (program: Program, vertices: Array<[number, number]>) => {
    const gl = program[ProgramProperty.WebGL2Context];
    setArray(program, AttributesProperty.VertexPosition, vertices.flat(), 2);
    setArray(program, AttributesProperty.Color, vertices.map(v => [1, 0, 0]).flat(), 3);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([...vertices.keys()]), gl.DYNAMIC_DRAW);
    gl.drawElements(gl.LINES, vertices.length, gl.UNSIGNED_SHORT, 0);
};

export const glDrawRect = (program: Program, position: [number, number], size: Vec2) => {
    const vertices = [];
    const colors = [];
    for (const v of [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
    ]) {
        vertices.push([position[0] + size[0] * v[0], position[1] + size[1] * v[1]]);
        colors.push([1, 1, 1]);
    }

    glDrawLineStrip(program, vertices, colors);
};

export const glDrawBoundingBox = (program: Program, position: Vec2, size: Vec2) => {
    glDrawRect(program, [position[0] - size[0] / 2, position[1]], size);
};

export type ColorRGB = [number, number, number];

export const enum VertexProperty {
    Position,
    Color,
}

type Vertex = {
    [VertexProperty.Position]: Vec2;
    [VertexProperty.Color]: ColorRGB;
};

type MeshTriangle = [Vertex, Vertex, Vertex];

export const glMeshTrianglesCreate = (program: Program, triangles: MeshTriangle[]) => {
    const vertices = triangles.flat();
    return glMeshCreate(program, vertices, [...vertices.keys()]);
};

export const glMeshPolygonCreate = (program: Program, vertices: Vertex[]) => {
    // vertices[0] is added twice to the end to
    // (1) close the polygon and
    // (2) because of trick with stencil test to render concave polygons
    const plus1: Vertex[] = [...vertices, vertices[0], vertices[0]];
    return glMeshCreate(program, plus1, [...plus1.keys()]);
};

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
    updateCurrentMatrix(program);
};

const updateCurrentMatrix = (program: Program) => {
    program[ProgramProperty.WebGL2Context].uniformMatrix3fv(
        program[ProgramProperty.Uniforms][UniformsProperty.ModelTransform],
        false,
        program[ProgramProperty.ModelMatrixStack][program[ProgramProperty.CurrentModelMatrix]]
    );
};

export const glModelTranslate = (program: Program, x: number, y: number) => {
    const matrix = program[ProgramProperty.ModelMatrixStack][program[ProgramProperty.CurrentModelMatrix]];
    matrixTranslate(matrix, x, y);
    updateCurrentMatrix(program);
};

export const glModelScale = (program: Program, x: number, y: number) => {
    const matrix = program[ProgramProperty.ModelMatrixStack][program[ProgramProperty.CurrentModelMatrix]];
    matrixScale(matrix, x, y);
    updateCurrentMatrix(program);
};

export const glModelRotate = (program: Program, angle: number) => {
    const matrix = program[ProgramProperty.ModelMatrixStack][program[ProgramProperty.CurrentModelMatrix]];
    matrixRotate(matrix, angle);
    updateCurrentMatrix(program);
};

export const glModelMultiply = (program: Program, matrix: Matrix3) => {
    const current = program[ProgramProperty.ModelMatrixStack][program[ProgramProperty.CurrentModelMatrix]];
    matrixMultiply(current, matrix, current);
    updateCurrentMatrix(program);
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

    gl.enable(gl.STENCIL_TEST);
    gl.clear(gl.STENCIL_BUFFER_BIT);
    gl.colorMask(false, false, false, false);
    gl.stencilFunc(gl.ALWAYS, 1, 1);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);
    gl.stencilMask(1);

    gl.drawElements(mesh[MeshProperty.DrawMode], mesh[MeshProperty.IndicesLength], gl.UNSIGNED_SHORT, 0);
    gl.colorMask(true, true, true, true);
    gl.stencilFunc(gl.EQUAL, 1, 1);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    gl.drawElements(mesh[MeshProperty.DrawMode], mesh[MeshProperty.IndicesLength], gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(null);
    gl.disable(gl.STENCIL_TEST);
};
