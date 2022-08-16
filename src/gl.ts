import { Matrix3, matrixCreate, matrixScale } from './glm';
import fragmentShaderCode from './shaders/fragment.glsl';
import vertexShaderCode from './shaders/vertex.glsl';

const enum ProgramProperty {
    WebGL2Context,
    Program,
    Attributes,
    Uniforms,
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

export const glProgramCreate = (canvas: HTMLCanvasElement): Program => {
    const gl = canvas.getContext('webgl2');
    if (gl === null) {
        throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.');
    }

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
        },
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

const glMeshCreate = (program: Program, vertices: number[], colors: number[], indices: number[]): Mesh => {
    const gl = program[ProgramProperty.WebGL2Context];
    const vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayObject);

    setArray(program, AttributesProperty.VertexPosition, vertices, 2);
    setArray(program, AttributesProperty.Color, colors, 3);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return [vertexArrayObject, indices.length, gl.TRIANGLES];
};

export const enum VertexProperty {
    Position,
    Color,
}

type Vertex = {
    [VertexProperty.Position]: [number, number];
    [VertexProperty.Color]: [number, number, number];
};

type MeshTriangle = [Vertex, Vertex, Vertex];

export const glMeshTrianglesCreate = (program: Program, triangles: MeshTriangle[]) => {
    const vertices = triangles.flat();
    return glMeshCreate(
        program,
        vertices.flatMap(v => v[VertexProperty.Position]),
        vertices.flatMap(v => v[VertexProperty.Color]),
        [...vertices.keys()]
    );
};

export const glSetModelTransform = (program: Program, transform: Matrix3) => {
    program[ProgramProperty.WebGL2Context].uniformMatrix3fv(
        program[ProgramProperty.Uniforms][UniformsProperty.ModelTransform],
        false,
        transform
    );
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
    gl.drawElements(mesh[MeshProperty.DrawMode], mesh[MeshProperty.IndicesLength], gl.UNSIGNED_SHORT, 0);
};
