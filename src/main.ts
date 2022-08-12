import { keyboardInitialize } from './keyboard';
import { meshCreateCube, meshCreationContextCreate, meshDraw } from './mesh';
import { terrainCreate } from './terrain';
import {
    matrixCreate,
    matrixMultiply,
    matrixMultiplyVector,
    matrixRotateX,
    matrixRotateY,
    matrixRotateZ,
    matrixScaleX,
    matrixScaleY,
    matrixSetIdentity,
    matrixSetProjection,
    matrixTranslateX,
    matrixTranslateY,
    matrixTranslateZ,
    vectorAdd,
    vectorCreate,
} from './glm';
import { perlinCreate, perlinGet } from './perlin';
import { personCreate, personDraw } from './person';
import {
    glCreateMeshCreationContext,
    glCreateProgram,
    glSetCurrentTime,
    glSetModel,
    glSetProjection,
    glSetSkyColor,
    glSetView,
    glSetViewPosition,
    glUseProgram,
} from './gl';

const main = async () => {
    addEventListener('resize', resize);
    resize();

    const canvas: HTMLCanvasElement = document.querySelector('#game-canvas');
    const gl = canvas.getContext('webgl2');
    if (gl === null) {
        throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.');
    }

    const program = glCreateProgram(gl);
    const meshCreationContext = glCreateMeshCreationContext(program);
    const cubeMesh = meshCreateCube(meshCreationContext);
    const terrainMesh = terrainCreate(meshCreationContext, 200, 200, 100, 100, 10);

    const projectionMatrix = matrixCreate();
    const updateViewport = () => {
        gl.viewport(0, 0, canvas.width, canvas.height);
        matrixSetProjection(projectionMatrix, 60, canvas.width / canvas.height, 0.01, 100);
        if (canvas.width < canvas.height) {
            const scale = canvas.height / canvas.width;
            matrixScaleX(projectionMatrix, scale);
            matrixScaleY(projectionMatrix, scale);
        }
    };
    addEventListener('resize', updateViewport);
    updateViewport();

    const viewRotation = vectorCreate();
    const viewRotationMatrix = matrixCreate();
    const viewPoint = vectorCreate();
    const viewPosition = matrixCreate();
    const speed = vectorCreate();
    viewPoint[0] = 0.0;
    viewPoint[1] = -4.0;

    const viewMatrix = matrixCreate();
    const cubeMatrix = matrixCreate();
    const cubeMatrix2 = matrixCreate();
    const person = personCreate(meshCreationContext);
    matrixTranslateX(cubeMatrix, 50.0);
    matrixTranslateY(cubeMatrix, 50.0);
    matrixTranslateX(cubeMatrix2, 55.0);
    matrixTranslateY(cubeMatrix2, 50.0);

    const terrainMatrix = matrixCreate();
    const keyboard = keyboardInitialize(['KeyL', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

    const mouseSpeed = [0, 0];

    addEventListener('click', () => {
        canvas.requestPointerLock();
    });

    addEventListener('mousemove', event => {
        mouseSpeed[0] += event.movementX;
        mouseSpeed[1] += event.movementY;
    });

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);

    const skyColor: [number, number, number] = [0.1, 0.4, 1.0];
    glSetSkyColor(program, skyColor);

    const perlinTexture = await createPerlinTexture(gl);

    let previousTime = 0;
    const loop = (time: number) => {
        const deltaTime = time - previousTime;
        previousTime = time;

        if (keyboard.get('ArrowLeft')) {
            viewRotation[1] -= 0.02;
        }

        if (keyboard.get('ArrowRight')) {
            viewRotation[1] += 0.02;
        }

        speed[0] = 0.05 * (keyboard.get('KeyA') ? -1 : keyboard.get('KeyD') ? 1 : 0);
        speed[1] = 0.05 * (keyboard.get('ArrowDown') ? -1 : keyboard.get('ArrowUp') ? 1 : 0);
        speed[2] = 0.05 * (keyboard.get('KeyW') ? -1 : keyboard.get('KeyS') ? 1 : 0);

        viewRotation[0] += mouseSpeed[1] * 0.005;
        viewRotation[1] += mouseSpeed[0] * 0.005;
        mouseSpeed[0] = 0;
        mouseSpeed[1] = 0;

        matrixSetIdentity(viewRotationMatrix);
        matrixRotateX(viewRotationMatrix, -Math.PI / 2);
        matrixRotateY(viewRotationMatrix, viewRotation[1]);
        matrixRotateX(viewRotationMatrix, viewRotation[0]);
        matrixMultiplyVector(speed, viewRotationMatrix);
        vectorAdd(viewPoint, speed);

        matrixRotateX(cubeMatrix, 0.0009 * deltaTime);
        matrixRotateY(cubeMatrix, 0.0006 * deltaTime);
        matrixRotateZ(cubeMatrix, 0.0003 * deltaTime);

        matrixSetIdentity(viewPosition);
        matrixTranslateX(viewPosition, -viewPoint[0]);
        matrixTranslateY(viewPosition, -viewPoint[1]);
        matrixTranslateZ(viewPosition, -viewPoint[2]);
        matrixMultiply(viewMatrix, viewRotationMatrix, viewPosition);

        matrixSetIdentity(cubeMatrix2);
        matrixTranslateX(cubeMatrix2, viewPoint[0]);
        matrixTranslateY(cubeMatrix2, viewPoint[1]);
        matrixTranslateZ(cubeMatrix2, viewPoint[2]);

        gl.clearColor(...skyColor, 1.0);
        gl.clearDepth(200.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        glUseProgram(program);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, perlinTexture);
        glSetView(program, viewMatrix);
        glSetProjection(program, projectionMatrix);
        glSetCurrentTime(program, time);
        glSetViewPosition(program, viewPosition);

        glSetModel(program, cubeMatrix);
        meshDraw(cubeMesh, program);
        glSetModel(program, cubeMatrix2);
        meshDraw(cubeMesh, program);
        glSetModel(program, terrainMatrix);
        meshDraw(terrainMesh, program);

        personDraw(person, program);

        requestAnimationFrame(loop);
    };

    loop(previousTime);
};

const createPerlinTexture = async (gl: WebGL2RenderingContext) => {
    const buffer = document.createElement('canvas');
    const size = 256;
    buffer.width = size;
    buffer.height = size;

    const bufferContext = buffer.getContext('2d');

    const perlin = perlinCreate();
    bufferContext.clearRect(0, 0, buffer.width, buffer.height);
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const brightness = 0.5 + 0.5 * perlinGet(perlin, (20 * x) / size, (20 * y) / size);
            bufferContext.fillStyle = `rgb(${brightness * 255}, 0, 0)`;
            bufferContext.fillRect(x, y, 1, 1);
        }
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // TODO: try to use UNSIGNED_INT OR BYTE instead of RGBA
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, await loadImage(buffer.toDataURL('image/png')));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
};

const loadImage = (src: string) =>
    new Promise<HTMLImageElement>(resolve => {
        const image = new Image();
        image.src = src;
        image.onload = () => resolve(image);
    });

const resize = () => {
    const pixelSize = 1;
    const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
    canvas.width = (document.body.clientWidth * devicePixelRatio) / pixelSize;
    canvas.height = (document.body.clientHeight * devicePixelRatio) / pixelSize;
    const vMin = Math.min(document.body.clientWidth, document.body.clientHeight) / 100;
    document.documentElement.style.fontSize = `${vMin}px`;
};

window.onload = main;
