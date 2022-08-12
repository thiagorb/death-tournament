import { Matrix4, Vec3 } from './glm';
import { meshCreationContextCreate } from './mesh';
import fragmentShaderCode from './shaders/fragment.glsl';
import vertexShaderCode from './shaders/vertex.glsl';

const enum ProgramProperty {
    WebGL2Context,
    Program,
    View,
    ViewPosition,
    CurrentTime,
    Model,
    Projection,
    SkyColor,
    PerlinSampler,
}

export type Program = {
    [ProgramProperty.WebGL2Context]: WebGL2RenderingContext;
    [ProgramProperty.Program]: WebGLProgram;
    [ProgramProperty.View]: WebGLUniformLocation;
    [ProgramProperty.ViewPosition]: WebGLUniformLocation;
    [ProgramProperty.CurrentTime]: WebGLUniformLocation;
    [ProgramProperty.Model]: WebGLUniformLocation;
    [ProgramProperty.Projection]: WebGLUniformLocation;
    [ProgramProperty.SkyColor]: WebGLUniformLocation;
    [ProgramProperty.PerlinSampler]: WebGLUniformLocation;
};

export const glCreateProgram = (gl: WebGL2RenderingContext): Program => {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderCode);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);
    const perlinSampler = gl.getUniformLocation(program, 'perlinSampler');
    gl.uniform1i(perlinSampler, 0);

    return {
        [ProgramProperty.WebGL2Context]: gl,
        [ProgramProperty.Program]: program,
        [ProgramProperty.View]: gl.getUniformLocation(program, 'view'),
        [ProgramProperty.ViewPosition]: gl.getUniformLocation(program, 'viewPosition'),
        [ProgramProperty.CurrentTime]: gl.getUniformLocation(program, 'currentTime'),
        [ProgramProperty.Model]: gl.getUniformLocation(program, 'model'),
        [ProgramProperty.Projection]: gl.getUniformLocation(program, 'projection'),
        [ProgramProperty.SkyColor]: gl.getUniformLocation(program, 'skyColor'),
        [ProgramProperty.PerlinSampler]: perlinSampler,
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

export const glCreateMeshCreationContext = (program: Program) =>
    meshCreationContextCreate(program[ProgramProperty.WebGL2Context], program[ProgramProperty.Program]);

export const glSetSkyColor = (program: Program, color: [number, number, number]) => {
    program[ProgramProperty.WebGL2Context].uniform3f(program[ProgramProperty.SkyColor], ...color);
};

export const glSetView = (program: Program, view: Matrix4) => {
    program[ProgramProperty.WebGL2Context].uniformMatrix4fv(program[ProgramProperty.View], false, view);
};

export const glSetViewPosition = (program: Program, viewPosition: Matrix4) => {
    program[ProgramProperty.WebGL2Context].uniformMatrix4fv(program[ProgramProperty.ViewPosition], false, viewPosition);
};

export const glSetModel = (program: Program, model: Matrix4) => {
    program[ProgramProperty.WebGL2Context].uniformMatrix4fv(program[ProgramProperty.Model], false, model);
};

export const glSetProjection = (program: Program, projection: Matrix4) => {
    program[ProgramProperty.WebGL2Context].uniformMatrix4fv(program[ProgramProperty.Projection], false, projection);
};

export const glSetCurrentTime = (program: Program, currentTime: number) => {
    program[ProgramProperty.WebGL2Context].uniform1f(program[ProgramProperty.CurrentTime], currentTime);
};

export const glUseProgram = (program: Program) => {
    program[ProgramProperty.WebGL2Context].useProgram(program[ProgramProperty.Program]);
};

export const glGetContext = (program: Program): WebGL2RenderingContext => {
    return program[ProgramProperty.WebGL2Context];
};
