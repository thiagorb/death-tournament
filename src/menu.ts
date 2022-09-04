import { backgroundDraw, BACKGROUND_COLOR } from './background';
import { FLOOR_LEVEL, gameIsOutOfArea, GAME_WIDTH } from './game';
import { glClear, Program } from './gl';
import { vectorCreate } from './glm';
import { Person, personCreate, personDraw, personGetPosition, personStep, personTurnLeft } from './person';

const enum MenuProperties {
    Running,
}

type Menu = ReturnType<typeof menuCreate>;

export const menuStop = (menu: Menu) => {
    menu[MenuProperties.Running] = false;
};

export const menuCreate = (program: Program) => {
    const menu = {
        [MenuProperties.Running]: true,
    };

    const people = new Set<Person>();
    let nextPerson = 1000;
    const step = (deltaTime: number) => {
        for (const person of people) {
            personStep(person, deltaTime);
            if (gameIsOutOfArea(personGetPosition(person))) {
                people.delete(person);
            }
        }

        nextPerson -= deltaTime;
        if (nextPerson < 0) {
            const person = personCreate(vectorCreate((Math.random() - 0.5) * GAME_WIDTH, FLOOR_LEVEL));
            people.add(person);
            if (Math.random() < 0.5) {
                personTurnLeft(person);
            }
            nextPerson = 1000;
        }
    };

    const render = () => {
        glClear(program, BACKGROUND_COLOR);

        backgroundDraw(program);
        for (const person of people) {
            personDraw(person, program);
        }
    };

    let previousTime = 0;
    const loop = (time: number) => {
        const deltaTime = time - previousTime;
        previousTime = time;

        step(deltaTime * 0.5);
        render();

        if (menu[MenuProperties.Running]) {
            requestAnimationFrame(loop);
        }
    };

    requestAnimationFrame((time: number) => loop((previousTime = time)));

    return;
};
