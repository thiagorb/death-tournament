import { backgroundDraw, backgroundInit } from './background';
import { deathAttack, deathCreate, deathDraw, deathInit, deathIsHitting, deathStep, deathWalk } from './death';
import { glClear, glDrawBoundingBox, glModelPop, glModelPush, glModelTranslate, glProgramCreate } from './gl';
import { Vec2, vectorCreate } from './glm';
import { keyboardInitialize } from './keyboard';
import { personCreate, personDie, personDraw, personInit, personStep } from './person';

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
    backgroundInit(program);
    const death = deathCreate();
    const person = personCreate();
    const deathPosition = vectorCreate();
    const deathSize = vectorCreate(50, 100);

    let previousTime = 0;

    const step = (deltaTime: number) => {
        const speed = deltaTime * 0.3;

        if (keyboard.ArrowLeft) {
            deathWalk(death, deltaTime, true);
        } else if (keyboard.ArrowRight) {
            deathWalk(death, deltaTime, false);
        }

        if (keyboard.KeyA) {
            deathAttack(death);
        }

        if (deathIsHitting(death, person)) {
            personDie(person);
        }

        deathStep(death, deltaTime);
        personStep(person, deltaTime);
    };

    const render = () => {
        glClear(program, [0, 0, 0.3, 1]);

        glModelPush(program);
        glModelTranslate(program, 0, -50);

        backgroundDraw(program);
        deathDraw(death, program);
        personDraw(person, program);

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

const x = (p1: Vec2, s1: Vec2, p2: Vec2, s2: Vec2) => {
    return p1[0] <= p2[0] + s2[0] && p1[1] < p2[1] + s2[1];
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
