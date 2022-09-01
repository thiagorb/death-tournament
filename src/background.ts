import { Program } from './gl';
import { Model, modelCreate, Object, objectCreate, objectDraw } from './model';
import * as modelData from '../art/background.svg';

let background: Object;

export const backgroundInit = (program: Program) => {
    background = objectCreate(modelCreate(program, modelData.model));
};

export const backgroundDraw = (program: Program) => {
    objectDraw(background, program);
};
