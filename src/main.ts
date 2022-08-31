import { keyboardInitialize } from './keyboard';
import { glClear, glDrawBoundingBox, glDrawRect, glModelPop, glModelPush, glModelTranslate, glProgramCreate } from './gl';
import { matrixSetIdentity, matrixTranslate, vectorCreate } from './glm';
import {
    deathAttack,
    deathCreate,
    deathDraw,
    deathGetTransform,
    deathInit,
    deathStep,
    deathTurnLeft,
    deathTurnRight,
    deathWalk,
} from './death';
import { personCreate, personDraw, personGetTransform, personInit, personStep } from './person';

const main = async () => {
    addEventListener('resize', resize);
    resize();

    const canvas: HTMLCanvasElement = document.querySelector('#game-canvas');
    const program = glProgramCreate(canvas);

    const keyboard = keyboardInitialize(['KeyA', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

    const mouseSpeed = [0, 0];

    addEventListener('mousemove', event => {
        mouseSpeed[0] += event.movementX;
        mouseSpeed[1] += event.movementY;
    });

    deathInit(program);
    personInit(program);
    const death = deathCreate();
    const person = personCreate();
    const deathPosition = vectorCreate();
    const personPosition = vectorCreate();
    const deathSize = vectorCreate(50, 100);

    let previousTime = 0;

    const step = (deltaTime: number) => {
        const speed = deltaTime * 0.3;
        if (keyboard.ArrowUp) {
            deathPosition[1] += speed;
            deathWalk(death);
        } else if (keyboard.ArrowDown) {
            deathPosition[1] -= speed;
            deathWalk(death);
        }

        if (keyboard.ArrowLeft) {
            deathPosition[0] -= speed;
            deathWalk(death);
            deathTurnLeft(death);
        } else if (keyboard.ArrowRight) {
            deathPosition[0] += speed;
            deathWalk(death);
            deathTurnRight(death);
        }

        if (keyboard.KeyA) {
            deathAttack(death);
        }

        deathStep(death, deltaTime);
        personStep(person, deltaTime);
    };

    const render = () => {
        glClear(program, [0, 0, 0.3, 1]);

        glModelPush(program);

        glModelTranslate(program, 0, -200);

        matrixSetIdentity(deathGetTransform(death));
        matrixTranslate(deathGetTransform(death), deathPosition[0], deathPosition[1]);
        deathDraw(program, death);

        matrixSetIdentity(personGetTransform(person));
        matrixTranslate(personGetTransform(person), personPosition[0], personPosition[1]);
        personDraw(program, person);

        glDrawBoundingBox(program, deathPosition, deathSize);

        glModelPop(program);
    };

    const loop = (time: number) => {
        const deltaTime = (time - previousTime) * 0.5;
        previousTime = time;

        step(deltaTime);
        render();

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
