import { backgroundDraw, BACKGROUND_COLOR } from './background';
import {
    Death,
    deathAttack,
    deathCollidesWithHourglass,
    deathCreate,
    deathDraw,
    deathGetBoundingLeft,
    deathGetBoundingRight,
    deathGetPosition,
    deathIsFacingLeft,
    deathIsFading,
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
import { Models, models, objectCreate } from './model';
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
import { storageGetHighscore, storageSetHighscore } from './storage';
import { updaterCreate, updaterSet } from './ui';

export const FLOOR_LEVEL = -90;
export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 500;
export const GAME_WIDTH = 670;
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
    Enemy,
    EnemyHealth,
    Score,
    NextPerson,
    NextHourglass,
    NextDog,
    NextEnemy,
    TimeLeft,
    TimePassed,
    Combo,
}

export type Game = ReturnType<typeof gameCreate>;

export const gameCreate = () => ({
    [GameProperties.Death]: deathCreate(vectorCreate(0, FLOOR_LEVEL), objectCreate(models[Models.Scythe])),
    [GameProperties.People]: new Set<Person>(),
    [GameProperties.Hourglasses]: new Set<Hourglass>(),
    [GameProperties.Dogs]: new Set<Dog>(),
    [GameProperties.Enemy]: null as Death,
    [GameProperties.EnemyHealth]: 10,
    [GameProperties.Score]: 0,
    [GameProperties.NextPerson]: 1000,
    [GameProperties.NextHourglass]: 3000,
    [GameProperties.NextDog]: 5000,
    [GameProperties.NextEnemy]: 1000,
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
            game[GameProperties.Score] += ++game[GameProperties.Combo];
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

let previousIntention = null;
let responseDelay = 0;
export const gameEnemyStep = (game: Game, deltaTime: number) => {
    const player = game[GameProperties.Death];
    const enemy = game[GameProperties.Enemy];
    if (enemy) {
        if (!gameIsOver(game) && !deathIsFading(enemy)) {
            const playerX = deathGetPosition(player)[0];
            const playerDeltaX = playerX - deathGetPosition(enemy)[0];
            let desiredX;
            if (Math.abs(playerX) > GAME_WIDTH / 2 - 100) {
                desiredX = playerX + 80 * (playerX > 0 ? -1 : 1);
            } else {
                desiredX = playerX + 80 * (playerDeltaX > 0 ? -1 : 1);
            }

            const deltaX = desiredX - deathGetPosition(enemy)[0];
            const facingOpposite = deathIsFacingLeft(enemy) !== playerDeltaX < 0;

            let intention = null;
            if ((Math.abs(deltaX) > 10 && facingOpposite) || Math.abs(deltaX) > 20) {
                intention = 1;
            } else if (facingOpposite) {
                intention = 2;
            }

            if (responseDelay > 0) {
                responseDelay -= deltaTime;
            } else if (previousIntention !== intention) {
                responseDelay = 150 + Math.random() * 150;
                previousIntention = intention;
            } else {
                if (intention === 1) {
                    deathWalk(enemy, deltaTime, deltaX < 0);
                } else if (intention === 2) {
                    deathWalk(enemy, deltaTime, !deathIsFacingLeft(enemy));
                }
            }

            if (!facingOpposite && Math.random() < 0.01) {
                deathAttack(enemy);
            }

            if (deathIsHitting(enemy, deathGetBoundingLeft(player), deathGetBoundingRight(player))) {
                const timeIncrease = -1;
                game[GameProperties.TimeLeft] += timeIncrease * 1000;
                createIndicator(
                    `${timeIncrease}s`,
                    `#f88`,
                    deathGetPosition(player)[0],
                    deathGetPosition(player)[1] + 30
                );
            }

            if (deathIsHitting(player, deathGetBoundingLeft(enemy), deathGetBoundingRight(enemy))) {
                if (--game[GameProperties.EnemyHealth] <= 0) {
                    deathStartFade(enemy);
                }
            }
        }

        deathStep(enemy, deltaTime);
    }

    game[GameProperties.NextEnemy] -= deltaTime;
    if (game[GameProperties.NextEnemy] < 0) {
        const enemy = deathCreate(vectorCreate(0, FLOOR_LEVEL), objectCreate(models[Models.ScytheCurved]));
        if (Math.random() < 0.5) {
            deathWalk(enemy, deltaTime, true);
        }
        game[GameProperties.Enemy] = enemy;
        game[GameProperties.NextEnemy] = Infinity;
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
    gameEnemyStep(game, deltaTime);
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

    if (game[GameProperties.Enemy]) {
        deathDraw(game[GameProperties.Enemy], program);
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
            document.querySelectorAll('.after-game').forEach(e => e.classList.remove('hidden'));

            const score = game[GameProperties.Score];
            storageSetHighscore(Math.max(storageGetHighscore(), score));
            (document.querySelector('#last-score') as HTMLElement).innerText = score as any as string;
            menuStart(program, game);
        }
    };

    requestAnimationFrame((time: number) => loop((previousTime = time)));
};

export const gameIsOver = (game: Game) => game[GameProperties.TimeLeft] <= 0;
