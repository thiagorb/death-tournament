import { backgroundInit } from './background';
import { deathInit } from './death';
import { dogInit } from './dog';
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './game';
import { glProgramCreate } from './gl';
import { hourglassInit } from './hourglass';
import { menuStart } from './menu';
import { personInit } from './person';

const main = async () => {
    const canvas: HTMLCanvasElement = document.querySelector('#game-canvas');
    const program = glProgramCreate(canvas, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    deathInit(program);
    personInit(program);
    hourglassInit(program);
    backgroundInit(program);
    dogInit(program);

    menuStart(program);
};

window.onload = main;
