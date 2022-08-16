import { keyboardInitialize } from './keyboard';
import { glClear, glMeshDraw, glMeshTrianglesCreate, glProgramCreate, glSetModelTransform, VertexProperty } from './gl';
import { matrixCreate, matrixRotate, matrixTranslate } from './glm';

const main = async () => {
    addEventListener('resize', resize);
    resize();

    const canvas: HTMLCanvasElement = document.querySelector('#game-canvas');
    const program = glProgramCreate(canvas);

    const keyboard = keyboardInitialize(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

    const mouseSpeed = [0, 0];

    addEventListener('click', () => {
        canvas.requestPointerLock();
    });

    addEventListener('mousemove', event => {
        mouseSpeed[0] += event.movementX;
        mouseSpeed[1] += event.movementY;
    });

    const triangleMesh = glMeshTrianglesCreate(program, [
        [
            {
                [VertexProperty.Position]: [-0.25, -0.25],
                [VertexProperty.Color]: [1, 0, 0],
            },
            {
                [VertexProperty.Position]: [0, 0.25],
                [VertexProperty.Color]: [0, 1, 0],
            },
            {
                [VertexProperty.Position]: [0.25, -0.25],
                [VertexProperty.Color]: [0, 0, 1],
            },
        ],
    ]);

    const modelTransform = matrixCreate();

    let previousTime = 0;
    const loop = (time: number) => {
        const deltaTime = time - previousTime;
        previousTime = time;

        if (keyboard.ArrowUp) {
            matrixTranslate(modelTransform, 0, deltaTime * 0.001);
        }

        if (keyboard.ArrowDown) {
            matrixTranslate(modelTransform, 0, -deltaTime * 0.001);
        }

        if (keyboard.ArrowLeft) {
            matrixTranslate(modelTransform, -deltaTime * 0.001, 0);
        }

        if (keyboard.ArrowRight) {
            matrixTranslate(modelTransform, deltaTime * 0.001, 0);
        }

        if (keyboard.KeyA) {
            matrixRotate(modelTransform, -deltaTime * 0.005);
        }

        if (keyboard.KeyD) {
            matrixRotate(modelTransform, deltaTime * 0.005);
        }

        glClear(program);
        glSetModelTransform(program, modelTransform);
        glMeshDraw(program, triangleMesh);

        requestAnimationFrame(loop);
    };

    loop(previousTime);
};

const resize = () => {
    const pixelSize = 1;
    const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
    canvas.width = (document.body.clientWidth * devicePixelRatio) / pixelSize;
    canvas.height = (document.body.clientHeight * devicePixelRatio) / pixelSize;
    const vMin = Math.min(document.body.clientWidth, document.body.clientHeight) / 100;
    document.documentElement.style.fontSize = `${vMin}px`;
};

window.onload = main;
