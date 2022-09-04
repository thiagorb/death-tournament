import { backgroundInit } from './background';
import { deathInit } from './death';
import { dogInit } from './dog';
import { gameCreate, gameStart, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './game';
import { glProgramCreate } from './gl';
import { hourglassInit } from './hourglass';
import { personInit } from './person';

const main = async () => {
    const canvas: HTMLCanvasElement = document.querySelector('#game-canvas');
    const program = glProgramCreate(canvas, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    const mouseSpeed = [0, 0];

    addEventListener('mousemove', event => {
        mouseSpeed[0] += event.movementX;
        mouseSpeed[1] += event.movementY;
    });

    deathInit(program);
    personInit(program);
    hourglassInit(program);
    backgroundInit(program);
    dogInit(program);

    document.querySelector('#start-game').addEventListener('click', () => {
        (document.querySelector('#ui') as HTMLElement).classList.add('hidden');
        const game = gameCreate();
        gameStart(game, program);
    });
};

window.onload = main;
