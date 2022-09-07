import { backgroundDraw, BACKGROUND_COLOR } from './background';
import {
    deathAttack,
    deathCollidesWithHourglass,
    deathCreate,
    deathDraw,
    deathGetPosition,
    deathIsHitting,
    deathStartFade,
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
import { getVirtualScreenHeight, getVirtualScreenWidth, glClear, glDrawRect, Program } from './gl';
import { Vec2, vectorCreate, vectorMultiply } from './glm';
import { Hourglass, hourglassCreate, hourglassDraw, hourglassGetPosition, hourglassStep } from './hourglass';
import { keyboardInitialize } from './keyboard';
import { menuStart } from './menu';
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

export const FLOOR_LEVEL = -200;
export const VIRTUAL_WIDTH = 1200;
export const VIRTUAL_HEIGHT = 600;
export const GAME_WIDTH = 1000;
const INITIAL_TIME = 30;

const timerDiv: HTMLDivElement = document.querySelector('#timer');
const scoreDiv: HTMLDivElement = document.querySelector('#score');
const timerUpdater = updaterCreate((n: number) =>
    timerDiv.style.setProperty('--progress', (n / (INITIAL_TIME - 2)) as any as string)
);
const scoreUpdater = updaterCreate((n: number) => scoreDiv.style.setProperty('--score', `'${n}`));
const keyboard = keyboardInitialize(['Space', 'ArrowLeft', 'ArrowRight']);

export const gameIsOutOfArea = (position: Vec2) => {
    return (
        position[0] > (getVirtualScreenWidth() * 1.1) / 2 ||
        position[0] < (-getVirtualScreenWidth() * 1.1) / 2 ||
        position[1] > (getVirtualScreenHeight() * 1.1) / 2 ||
        position[1] < (-getVirtualScreenHeight() * 1.1) / 2
    );
};

export const enum GameProperties {
    Death,
    People,
    Hourglasses,
    Dogs,
    Score,
    NextPerson,
    NextHourglass,
    NextDog,
    TimeLeft,
    TimePassed,
    Combo,
}

export type Game = ReturnType<typeof gameCreate>;

export const gameCreate = () => ({
    [GameProperties.Death]: deathCreate(vectorCreate(0, FLOOR_LEVEL)),
    [GameProperties.People]: new Set<Person>(),
    [GameProperties.Hourglasses]: new Set<Hourglass>(),
    [GameProperties.Dogs]: new Set<Dog>(),
    [GameProperties.Score]: 0,
    [GameProperties.NextPerson]: 1000,
    [GameProperties.NextHourglass]: 3000,
    [GameProperties.NextDog]: 5000,
    [GameProperties.TimeLeft]: INITIAL_TIME * 1000,
    // [GameProperties.TimePassed]: 3600000,
    [GameProperties.TimePassed]: 0,
    [GameProperties.Combo]: 0,
});

export const gamePeopleStep = (game: Game, deltaTime: number) => {
    for (const person of game[GameProperties.People]) {
        if (
            !personIsDead(person) &&
            deathIsHitting(game[GameProperties.Death], personGetLeft(person), personGetRight(person))
        ) {
            personDie(person);
            game[GameProperties.Score] += 2 ** game[GameProperties.Combo];
            game[GameProperties.Combo]++;
            game[GameProperties.TimeLeft] += 400;
        }
        personStep(person, deltaTime);
        if (personGetDeadTime(person) > 2000 || gameIsOutOfArea(personGetPosition(person))) {
            game[GameProperties.People].delete(person);
        }
    }

    game[GameProperties.NextPerson] -= deltaTime;
    if (game[GameProperties.NextPerson] < 0) {
        const person = personCreate(vectorCreate((Math.random() - 0.5) * GAME_WIDTH, FLOOR_LEVEL));
        game[GameProperties.People].add(person);
        if (Math.random() < 0.5) {
            personTurnLeft(person);
        }
        game[GameProperties.NextPerson] =
            1000 + Math.random() * 300 - Math.min(900, game[GameProperties.TimePassed] * 0.006);
    }
};

const createIndicator = (text: string, color: string, x: number, y: number) => {
    const indicator = document.createElement('div');
    indicator.classList.add('indicator');
    indicator.onanimationend = () => indicator.remove();
    indicator.innerText = text;
    Object.assign(indicator.style, {
        left: `calc(50% + ${x}px`,
        top: `calc(50% - ${y}px`,
        color: color,
    });
    document.querySelector('#screen').appendChild(indicator);
};

export const gameHourglasssStep = (game: Game, deltaTime: number) => {
    for (const hourglass of game[GameProperties.Hourglasses]) {
        hourglassStep(hourglass, deltaTime);

        if (deathCollidesWithHourglass(game[GameProperties.Death], hourglass) && !gameIsOver(game)) {
            game[GameProperties.Hourglasses].delete(hourglass);
            const timeIncrease = 10;
            game[GameProperties.TimeLeft] += timeIncrease * 1000;
            createIndicator(
                `+${timeIncrease}s`,
                `#8f8`,
                hourglassGetPosition(hourglass)[0],
                hourglassGetPosition(hourglass)[1] + 10
            );
        }

        if (gameIsOutOfArea(hourglassGetPosition(hourglass))) {
            game[GameProperties.Hourglasses].delete(hourglass);
        }
    }

    game[GameProperties.NextHourglass] -= deltaTime;
    if (game[GameProperties.NextHourglass] < 0) {
        const hourglass = hourglassCreate(vectorCreate((Math.random() - 0.5) * GAME_WIDTH, VIRTUAL_HEIGHT / 2));
        game[GameProperties.Hourglasses].add(hourglass);
        game[GameProperties.NextHourglass] =
            Math.random() * 3000 + 5000 + Math.min(8000, game[GameProperties.TimePassed] * 0.1);
    }
};

export const gameDogStep = (game: Game, deltaTime: number) => {
    for (const dog of game[GameProperties.Dogs]) {
        dogStep(dog, deltaTime);
        if (!dogIsDead(dog) && deathIsHitting(game[GameProperties.Death], dogGetLeft(dog), dogGetRight(dog))) {
            dogDie(dog);
            const timeIncrease = -5;
            game[GameProperties.TimeLeft] += timeIncrease * 1000;
            createIndicator(`${timeIncrease}s`, `#f88`, dogGetPosition(dog)[0], dogGetPosition(dog)[1] + 30);
        }

        if (dogGetDeadTime(dog) > 2000 || gameIsOutOfArea(dogGetPosition(dog))) {
            game[GameProperties.Dogs].delete(dog);
        }
    }

    game[GameProperties.NextDog] -= deltaTime;
    if (game[GameProperties.NextDog] < 0) {
        const dog = dogCreate(vectorCreate((Math.random() - 0.5) * GAME_WIDTH, FLOOR_LEVEL));
        if (Math.random() < 0.5) {
            dogTurnLeft(dog);
        }
        game[GameProperties.Dogs].add(dog);
        game[GameProperties.NextDog] =
            3000 + Math.random() * 1000 - Math.min(3000, game[GameProperties.TimePassed] * 0.006);
    }
};

export const gameStep = (game: Game, deltaTime: number) => {
    if (!gameIsOver(game)) {
        if (keyboard.ArrowLeft || keyboard.ArrowRight) {
            deathWalk(game[GameProperties.Death], deltaTime, keyboard.ArrowLeft);
        }

        if (keyboard.Space) {
            deathAttack(game[GameProperties.Death]);
        }
    }

    deathStep(game[GameProperties.Death], deltaTime);
    gamePeopleStep(game, deltaTime);
    gameHourglasssStep(game, deltaTime);
    gameDogStep(game, deltaTime);
};

export const gameRender = (game: Game, program: Program) => {
    glClear(program, BACKGROUND_COLOR);

    backgroundDraw(program);
    for (const person of game[GameProperties.People]) {
        personDraw(person, program);
    }
    for (const hourglass of game[GameProperties.Hourglasses]) {
        hourglassDraw(hourglass, program);
    }
    for (const dog of game[GameProperties.Dogs]) {
        dogDraw(dog, program);
    }

    deathDraw(game[GameProperties.Death], program);
    // renderDebuggingRects(program);
};

export const menuRender = (game: Game, program: Program) => {
    glClear(program, BACKGROUND_COLOR);

    backgroundDraw(program);
    for (const person of game[GameProperties.People]) {
        personDraw(person, program);
    }
    for (const dog of game[GameProperties.Dogs]) {
        dogDraw(dog, program);
    }
};

const virtualOrigin = vectorMultiply(vectorCreate(VIRTUAL_WIDTH, VIRTUAL_HEIGHT), -0.5);
const virtualSize = vectorCreate(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
const gameOrigin = vectorMultiply(vectorCreate(GAME_WIDTH, VIRTUAL_HEIGHT), -0.5);
const gameSize = vectorCreate(GAME_WIDTH, VIRTUAL_HEIGHT);
const renderDebuggingRects = (program: Program) => {
    glDrawRect(program, virtualOrigin, virtualSize);
    glDrawRect(program, gameOrigin, gameSize);
};

export const gameStart = (game: Game, program: Program) => {
    let comboTime = 0;
    const comboUpdater = updaterCreate((value: number) => {
        if (value === 0) {
            return;
        }

        comboTime = 1000;
        if (value === 1) {
            return;
        }

        const deathPosition = deathGetPosition(game[GameProperties.Death]);
        const text = `${value}x`;
        createIndicator(text, `#ff8`, deathPosition[0], deathPosition[1] + 100);
    });

    let previousTime = 0;
    const loop = (time: number) => {
        const deltaTime = time - previousTime;
        previousTime = time;

        const relativeSpeed = 0.6 + Math.min(0.4, ((game[GameProperties.TimePassed] * 0.00005) | 0) / 10);
        gameStep(game, deltaTime * relativeSpeed);
        gameRender(game, program);

        game[GameProperties.TimeLeft] = Math.max(0, game[GameProperties.TimeLeft] - deltaTime);
        game[GameProperties.TimePassed] += deltaTime;
        updaterSet(timerUpdater, (game[GameProperties.TimeLeft] / 1000) | 0);
        updaterSet(scoreUpdater, game[GameProperties.Score]);

        updaterSet(comboUpdater, game[GameProperties.Combo]);
        comboTime -= deltaTime;
        if (comboTime <= 0) {
            game[GameProperties.Combo] = 0;
            comboTime = 0;
        }

        if (game[GameProperties.TimeLeft] > 0) {
            requestAnimationFrame(loop);
        } else {
            deathStartFade(game[GameProperties.Death]);
            (document.querySelector('#game-over') as HTMLElement).classList.remove('hidden');
            menuStart(program, game);
        }
    };

    requestAnimationFrame((time: number) => loop((previousTime = time)));
};

export const gameIsOver = (game: Game) => game[GameProperties.TimeLeft] <= 0;
