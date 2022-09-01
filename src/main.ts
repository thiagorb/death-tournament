import { backgroundDraw, backgroundInit } from './background';
import { deathAttack, deathCreate, deathDraw, deathInit, deathIsHitting, deathStep, deathWalk } from './death';
import { glClear, glModelPop, glModelPush, glModelTranslate, glProgramCreate } from './gl';
import { Vec2 } from './glm';
import { keyboardInitialize } from './keyboard';
import { personCreate, personDie, personDraw, personInit, personStep } from './person';

const main = async () => {
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
    const people = [];
    const pepoleInterval = 3000;
    let nextPerson = pepoleInterval;

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

        deathStep(death, deltaTime);
        let i = people.length;
        while (i--) {
            const person = people[i];
            if (deathIsHitting(death, person)) {
                personDie(person);
            }
            personStep(person, deltaTime);
        }

        nextPerson -= deltaTime;
        if (nextPerson < 0) {
            people.push(personCreate());
            nextPerson = pepoleInterval;
        }
    };

    const render = () => {
        glClear(program, [0, 0, 0.3, 1]);

        glModelPush(program);
        glModelTranslate(program, 0, -50);

        backgroundDraw(program);
        deathDraw(death, program);
        let i = people.length;
        while (i--) {
            const person = people[i];
            personDraw(person, program);
        }

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

window.onload = main;
