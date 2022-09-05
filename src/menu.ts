import { deathCreate, deathStep } from './death';
import { Dog } from './dog';
import {
    FLOOR_LEVEL,
    Game,
    gameCreate,
    gameDogStep,
    gameIsOutOfArea as gameIsOutOfScreen,
    gamePeopleStep,
    GameProperties,
    gameRender,
    gameStart,
} from './game';
import { Program } from './gl';
import { vectorCreate } from './glm';
import { Hourglass } from './hourglass';
import { Person, personGetPosition } from './person';

export const menuStart = (program: Program, lastGame: Game = null) => {
    (document.querySelector('#game-ui') as HTMLElement).classList.add('hidden');
    (document.querySelector('#menu-ui') as HTMLElement).classList.remove('hidden');

    const menuScene: Game = lastGame || {
        [GameProperties.Death]: deathCreate(vectorCreate(0, -10000)),
        [GameProperties.People]: new Set<Person>(),
        [GameProperties.Hourglasses]: new Set<Hourglass>(),
        [GameProperties.Dogs]: new Set<Dog>(),
        [GameProperties.Score]: 0,
        [GameProperties.NextPerson]: 500,
        [GameProperties.NextHourglass]: 0,
        [GameProperties.NextDog]: 2000,
        [GameProperties.TimeLeft]: 0,
        [GameProperties.PersonInterval]: 1000,
    };
    let startingGame = false;
    let previousTime = 0;
    let speedMultiplier = 0.5;
    const loop = (time: number) => {
        const deltaTime = (time - previousTime) * speedMultiplier;
        previousTime = time;

        if (startingGame) {
            if (canStart(menuScene)) {
                (document.querySelector('#game-ui') as HTMLElement).classList.remove('hidden');
                const game = gameCreate();
                gameStart(game, program);
                return;
            }

            speedMultiplier = Math.min(2, speedMultiplier + 0.001 * deltaTime);
        }

        deathStep(menuScene[GameProperties.Death], deltaTime);
        gamePeopleStep(menuScene, deltaTime);
        gameDogStep(menuScene, deltaTime);
        gameRender(menuScene, program);

        requestAnimationFrame(loop);
    };

    requestAnimationFrame((time: number) => loop((previousTime = time)));

    const startButton = document.querySelector('#start-game');
    const startGame = () => {
        startingGame = true;
        menuScene[GameProperties.NextPerson] = Infinity;
        menuScene[GameProperties.NextDog] = Infinity;
        (document.querySelector('#menu-ui') as HTMLElement).classList.add('hidden');
        startButton.removeEventListener('click', startGame);
    };
    startButton.addEventListener('click', startGame);
};

const canStart = (menuScene: Game) => {
    return menuScene[GameProperties.People].size === 0 && menuScene[GameProperties.Dogs].size === 0;
};
