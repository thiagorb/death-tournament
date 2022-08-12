import { glGetContext, Program } from './gl';

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

export const enum MeshCreationContextProperty {
    GLContext,
    ShaderProgram,
}

export type MeshCreationContext = {
    [MeshCreationContextProperty.GLContext]: WebGL2RenderingContext;
    [MeshCreationContextProperty.ShaderProgram]: WebGLProgram;
};

export const meshCreateCube = (context: MeshCreationContext): Mesh => {
    // prettier-ignore
    const vertices = [
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    // prettier-ignore
    const normals = [
        // Front face
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        // Back face
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,

        // Top face
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        
        // Bottom face
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,

        // Right face
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        // Left face
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
    ];

    // prettier-ignore
    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10,  11,  // top
        12, 13, 14,     12, 14, 15,  // bottom
        16, 17, 18,     16, 18, 19,  // right
        20, 21, 22,     20, 22, 23,  // left
    ];

    // prettier-ignore
    const colors = [
        1, 0, 1,
        0, 0, 1,
        0, 1, 1,
        0, 0, 1,
        1, 1, 0,
        1, 0, 0,
        1, 1, 0,
        1, 1, 1,
        1, 0, 1,
        0, 0, 1,
        0, 1, 1,
        0, 0, 1,
        1, 1, 0,
        1, 0, 0,
        1, 1, 0,
        1, 1, 1,
        1, 0, 1,
        0, 0, 1,
        0, 1, 1,
        0, 0, 1,
        1, 1, 0,
        1, 0, 0,
        1, 1, 0,
        1, 1, 1,
    ];

    return meshCreate(context, vertices, colors, normals, indices);
};

const meshCreationContextSetArray = (context: MeshCreationContext, attributeName: string, values: number[]) => {
    const gl = context[MeshCreationContextProperty.GLContext];
    const buffer = gl.createBuffer();
    const attribute = gl.getAttribLocation(context[MeshCreationContextProperty.ShaderProgram], attributeName);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
};

export const meshCreate = (
    context: MeshCreationContext,
    vertices: number[],
    colors: number[],
    normals: number[],
    indices: number[]
): Mesh => {
    const gl = context[MeshCreationContextProperty.GLContext];
    const vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayObject);

    meshCreationContextSetArray(context, 'vertexPosition', vertices);
    meshCreationContextSetArray(context, 'color', colors);
    meshCreationContextSetArray(context, 'normal', normals);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return [vertexArrayObject, indices.length, gl.TRIANGLES];
};

export const meshCreationContextCreate = (gl: WebGL2RenderingContext, shaderProgram: WebGLProgram): MeshCreationContext => ({
    [MeshCreationContextProperty.GLContext]: gl,
    [MeshCreationContextProperty.ShaderProgram]: shaderProgram,
});

export const meshDraw = (mesh: Mesh, program: Program) => {
    const gl = glGetContext(program);
    gl.bindVertexArray(mesh[MeshProperty.VertexArrayObject]);
    gl.drawElements(mesh[MeshProperty.DrawMode], mesh[MeshProperty.IndicesLength], gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
};
