import { backgroundDraw, backgroundInit } from './background';
import { Clock, clockCreate, clockDraw, clockGetPosition, clockInit, clockStep } from './clock';
import {
    deathAttack,
    deathCollidesWithClock,
    deathCreate,
    deathDraw,
    deathInit,
    deathIsHitting,
    deathStep,
    deathWalk,
} from './death';
import { dogCreate, dogDie, dogDraw, dogGetLeft, dogGetRight, dogInit, dogIsDead, dogStep } from './dog';
import { glClear, glModelTranslate, glProgramCreate } from './gl';
import { Vec2, vectorCreate } from './glm';
import { keyboardInitialize } from './keyboard';
import {
    Person,
    personCreate,
    personDie,
    personDraw,
    personGetLeft,
    personGetRight,
    personGetDeadTime,
    personGetPosition,
    personInit,
    personIsDead,
    personStep,
    personTurnLeft,
} from './person';
import { timerCreate, timerIncrease, timerStep, updaterCreate, updaterSet } from './ui';

const outOfScreen = (position: Vec2) => {
    return position[0] > 1000 || position[0] < -1000 || position[1] > 1000 || position[1] < -1000;
};

const main = async () => {
    const canvas: HTMLCanvasElement = document.querySelector('#game-canvas');
    const timerDiv: HTMLDivElement = document.querySelector('#timer');
    const scoreDiv: HTMLDivElement = document.querySelector('#score');
    const program = glProgramCreate(canvas);

    const keyboard = keyboardInitialize(['KeyA', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

    const mouseSpeed = [0, 0];

    addEventListener('mousemove', event => {
        mouseSpeed[0] += event.movementX;
        mouseSpeed[1] += event.movementY;
    });

    glModelTranslate(program, 0, -150);

    deathInit(program);
    personInit(program);
    clockInit(program);
    backgroundInit(program);
    dogInit(program);
    const death = deathCreate();
    const dog = dogCreate(vectorCreate());
    const people = new Set<Person>();
    const clocks = new Set<Clock>();
    const timer = timerCreate((n: number) => (timerDiv.innerText = n as any as string));
    let score = 0;
    const scoreUpdater = updaterCreate((n: number) => (scoreDiv.innerText = n as any as string));
    let nextPerson = 0;
    let nextClock = 0;

    let previousTime = 0;

    const peopleStep = (deltaTime: number) => {
        for (const person of people) {
            if (!personIsDead(person) && deathIsHitting(death, personGetLeft(person), personGetRight(person))) {
                personDie(person);
                updaterSet(scoreUpdater, (score += 1));
            }
            personStep(person, deltaTime);
            if (personGetDeadTime(person) > 2000 || outOfScreen(personGetPosition(person))) {
                people.delete(person);
            }
        }

        nextPerson -= deltaTime;
        if (nextPerson < 0) {
            const person = personCreate(vectorCreate((Math.random() - 0.5) * 1000, 0));
            people.add(person);
            if (Math.random() < 0.5) {
                personTurnLeft(person);
            }
            nextPerson = Math.random() * 200 + 300;
        }
    };

    const clocksStep = (deltaTime: number) => {
        for (const clock of clocks) {
            clockStep(clock, deltaTime);

            if (deathCollidesWithClock(death, clock)) {
                clocks.delete(clock);
                timerIncrease(timer, 10000);
            }

            if (outOfScreen(clockGetPosition(clock))) {
                clocks.delete(clock);
            }
        }

        nextClock -= deltaTime;
        if (nextClock < 0) {
            const clock = clockCreate(vectorCreate((Math.random() - 0.5) * 1000, 500));
            clocks.add(clock);
            nextClock = Math.random() * 5000 + 10000;
        }
    };

    const step = (deltaTime: number) => {
        timerStep(timer, deltaTime);

        if (keyboard.ArrowLeft) {
            deathWalk(death, deltaTime, true);
        } else if (keyboard.ArrowRight) {
            deathWalk(death, deltaTime, false);
        }

        if (keyboard.KeyA) {
            deathAttack(death);
        }

        deathStep(death, deltaTime);
        peopleStep(deltaTime);
        clocksStep(deltaTime);
        dogStep(dog, deltaTime);

        if (!dogIsDead(dog) && deathIsHitting(death, dogGetLeft(dog), dogGetRight(dog))) {
            dogDie(dog);
            console.log('killed dog');
        }
    };

    const render = () => {
        glClear(program, [0, 0, 0.3, 1]);

        backgroundDraw(program);
        deathDraw(death, program);
        for (const person of people) {
            personDraw(person, program);
        }
        for (const clock of clocks) {
            clockDraw(clock, program);
        }
        dogDraw(dog, program);
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

window.onload = main;
