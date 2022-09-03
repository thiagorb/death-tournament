import * as modelData from '../art/hourglass.svg';
import { glModelPop, glModelPush, glModelTranslateVector, Program } from './gl';
import { Vec2 } from './glm';
import { Model, modelCreate, Object, objectCreate, objectDraw } from './model';

let model: Model;

export const hourglassInit = (program: Program) => {
    model = modelCreate(program, modelData.model);
};

const enum HourglassProperties {
    Position,
    Object,
}

export type Hourglass = {
    [HourglassProperties.Position]: Vec2;
    [HourglassProperties.Object]: Object;
};

export const hourglassCreate = (position: Vec2): Hourglass => ({
    [HourglassProperties.Position]: position,
    [HourglassProperties.Object]: objectCreate(model),
});

export const hourglassDraw = (hourglass: Hourglass, program: Program) => {
    glModelPush(program);
    glModelTranslateVector(program, hourglass[HourglassProperties.Position]);
    objectDraw(hourglass[HourglassProperties.Object], program);
    glModelPop(program);
};

export const hourglassStep = (hourglass: Hourglass, deltaTime: number) => {
    hourglass[HourglassProperties.Position][1] -= deltaTime * 0.2;
};

export const hourglassGetPosition = (hourglass: Hourglass) => hourglass[HourglassProperties.Position];
