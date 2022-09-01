import { backgroundDraw, backgroundInit } from './background';
import { deathAttack, deathCreate, deathDraw, deathInit, deathIsHitting, deathStep, deathWalk } from './death';
import { glClear, glModelPop, glModelPush, glModelTranslate, glProgramCreate } from './gl';
import { Vec2 } from './glm';
import { keyboardInitialize } from './keyboard';
import {
    Person,
    personCreate,
    personDie,
    personDraw,
    personGetBoundingLeft,
    personGetDeadTime,
    personInit,
    personSetPositionX,
    personStep,
    personTurnLeft,
} from './person';

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
    const people = new Set<Person>();
    const pepoleInterval = 300;
    let nextPerson = 0;

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
        for (const person of people) {
            if (deathIsHitting(death, person)) {
                personDie(person);
            }
            personStep(person, deltaTime);
            if (personGetDeadTime(person) > 2000 || personGetBoundingLeft(person) > 1000 || personGetBoundingLeft(person) < -1000) {
                people.delete(person);
            }
        }

        nextPerson -= deltaTime;
        if (nextPerson < 0) {
            const person = personCreate();
            people.add(person);
            personSetPositionX(person, (Math.random() - 0.5) * 1000);
            if (Math.random() < 0.5) {
                personTurnLeft(person);
            }
            nextPerson = pepoleInterval;
        }
    };

    const render = () => {
        glClear(program, [0, 0, 0.3, 1]);

        glModelPush(program);
        glModelTranslate(program, 0, -50);

        backgroundDraw(program);
        deathDraw(death, program);
        for (const person of people) {
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
