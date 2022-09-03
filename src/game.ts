import { backgroundDraw } from './background';
import {
    deathAttack,
    deathCollidesWithHourglass,
    deathCreate,
    deathDraw,
    deathIsHitting,
    deathStep,
    deathWalk,
} from './death';
import {
    Dog,
    dogCreate,
    dogDie,
    dogDraw,
    dogGetDeadTime,
    dogGetLeft,
    dogGetPosition,
    dogGetRight,
    dogIsDead,
    dogStep,
    dogTurnLeft,
} from './dog';
import { glClear, Program } from './gl';
import { Vec2, vectorCreate } from './glm';
import { Hourglass, hourglassCreate, hourglassDraw, hourglassGetPosition, hourglassStep } from './hourglass';
import { keyboardInitialize } from './keyboard';
import {
    Person,
    personCreate,
    personDie,
    personDraw,
    personGetDeadTime,
    personGetLeft,
    personGetPosition,
    personGetRight,
    personIsDead,
    personStep,
    personTurnLeft,
} from './person';
import { updaterCreate, updaterSet } from './ui';

const timerDiv: HTMLDivElement = document.querySelector('#timer');
const scoreDiv: HTMLDivElement = document.querySelector('#score');
const timerUpdater = updaterCreate((n: number) => (timerDiv.innerText = Math.round(n / 1000) as any as string));
const scoreUpdater = updaterCreate((n: number) => (scoreDiv.innerText = n as any as string));
const keyboard = keyboardInitialize(['KeyA', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

const outOfScreen = (position: Vec2) => {
    return position[0] > 1000 || position[0] < -1000 || position[1] > 1000 || position[1] < -1000;
};

const enum GameProperties {
    Death,
    People,
    Hourglasses,
    Dogs,
    Score,
    NextPerson,
    NextHourglass,
    NextDog,
    TimeLeft,
}

type Game = ReturnType<typeof gameCreate>;

export const gameCreate = () => ({
    [GameProperties.Death]: deathCreate(),
    [GameProperties.People]: new Set<Person>(),
    [GameProperties.Hourglasses]: new Set<Hourglass>(),
    [GameProperties.Dogs]: new Set<Dog>(),
    [GameProperties.Score]: 0,
    [GameProperties.NextPerson]: 3000,
    [GameProperties.NextHourglass]: 15000,
    [GameProperties.NextDog]: 8000,
    [GameProperties.TimeLeft]: 40000,
});

const gamePeopleStep = (game: Game, deltaTime: number) => {
    for (const person of game[GameProperties.People]) {
        if (
            !personIsDead(person) &&
            deathIsHitting(game[GameProperties.Death], personGetLeft(person), personGetRight(person))
        ) {
            personDie(person);
            updaterSet(scoreUpdater, (game[GameProperties.Score] += 1));
        }
        personStep(person, deltaTime);
        if (personGetDeadTime(person) > 2000 || outOfScreen(personGetPosition(person))) {
            game[GameProperties.People].delete(person);
        }
    }

    game[GameProperties.NextPerson] -= deltaTime;
    if (game[GameProperties.NextPerson] < 0) {
        const person = personCreate(vectorCreate((Math.random() - 0.5) * 1000, 0));
        game[GameProperties.People].add(person);
        if (Math.random() < 0.5) {
            personTurnLeft(person);
        }
        game[GameProperties.NextPerson] = Math.random() * 200 + 300;
    }
};

const gameHourglasssStep = (game: Game, deltaTime: number) => {
    for (const hourglass of game[GameProperties.Hourglasses]) {
        hourglassStep(hourglass, deltaTime);

        if (deathCollidesWithHourglass(game[GameProperties.Death], hourglass)) {
            game[GameProperties.Hourglasses].delete(hourglass);
            game[GameProperties.TimeLeft] += 10000;
        }

        if (outOfScreen(hourglassGetPosition(hourglass))) {
            game[GameProperties.Hourglasses].delete(hourglass);
        }
    }

    game[GameProperties.NextHourglass] -= deltaTime;
    if (game[GameProperties.NextHourglass] < 0) {
        const hourglass = hourglassCreate(vectorCreate((Math.random() - 0.5) * 1000, 500));
        game[GameProperties.Hourglasses].add(hourglass);
        game[GameProperties.NextHourglass] = Math.random() * 5000 + 8000;
    }
};

const gameDogStep = (game: Game, deltaTime: number) => {
    for (const dog of game[GameProperties.Dogs]) {
        dogStep(dog, deltaTime);
        if (!dogIsDead(dog) && deathIsHitting(game[GameProperties.Death], dogGetLeft(dog), dogGetRight(dog))) {
            dogDie(dog);
            game[GameProperties.TimeLeft] -= 5000;
        }

        if (dogGetDeadTime(dog) > 2000 || outOfScreen(dogGetPosition(dog))) {
            game[GameProperties.Dogs].delete(dog);
            game[GameProperties.NextDog] = 3000 + Math.random() * 1000;
        }
    }

    if (game[GameProperties.Dogs].size === 0) {
        game[GameProperties.NextDog] -= deltaTime;
        if (game[GameProperties.NextDog] < 0) {
            const dog = dogCreate(vectorCreate((Math.random() - 0.5) * 1000, 0));
            if (Math.random() < 0.5) {
                dogTurnLeft(dog);
            }
            game[GameProperties.Dogs].add(dog);
        }
    }
};

export const gameStep = (game: Game, deltaTime: number) => {
    if (keyboard.ArrowLeft || keyboard.ArrowRight) {
        deathWalk(game[GameProperties.Death], deltaTime, keyboard.ArrowLeft);
    }

    if (keyboard.KeyA) {
        deathAttack(game[GameProperties.Death]);
    }

    deathStep(game[GameProperties.Death], deltaTime);
    gamePeopleStep(game, deltaTime);
    gameHourglasssStep(game, deltaTime);
    gameDogStep(game, deltaTime);
};

export const gameRender = (game: Game, program: Program) => {
    glClear(program, [0, 0, 0.3, 1]);

    backgroundDraw(program);
    deathDraw(game[GameProperties.Death], program);
    for (const person of game[GameProperties.People]) {
        personDraw(person, program);
    }
    for (const hourglass of game[GameProperties.Hourglasses]) {
        hourglassDraw(hourglass, program);
    }
    for (const dog of game[GameProperties.Dogs]) {
        dogDraw(dog, program);
    }
};

export const gameStart = (game: Game, program: Program) => {
    let previousTime = 0;
    const loop = (time: number) => {
        const deltaTime = time - previousTime;
        previousTime = time;

        gameStep(game, deltaTime * 0.75);
        gameRender(game, program);

        updaterSet(
            timerUpdater,
            (game[GameProperties.TimeLeft] = Math.max(0, game[GameProperties.TimeLeft] - deltaTime))
        );

        if (game[GameProperties.TimeLeft] > 0) {
            requestAnimationFrame(loop);
        } else {
            (document.querySelector('#ui') as HTMLElement).classList.remove('hidden');
            (document.querySelector('#game-over') as HTMLElement).classList.remove('hidden');
        }
    };

    requestAnimationFrame((time: number) => loop((previousTime = time)));
};
