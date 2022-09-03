import { glModelPop, glModelPush, glModelTranslateVector, Program } from './gl';
import { Model, modelCreate, Object, objectCreate, objectDraw } from './model';
import * as modelData from '../art/clock.svg';
import { Vec2, vectorCreate } from './glm';
import { animatableDraw } from './animation';

let model: Model;

export const clockInit = (program: Program) => {
    model = modelCreate(program, modelData.model);
};

const enum ClockProperties {
    Position,
    Object,
}

export type Clock = {
    [ClockProperties.Position]: Vec2;
    [ClockProperties.Object]: Object;
};

export const clockCreate = (position: Vec2): Clock => ({
    [ClockProperties.Position]: position,
    [ClockProperties.Object]: objectCreate(model),
});

export const clockDraw = (clock: Clock, program: Program) => {
    glModelPush(program);
    glModelTranslateVector(program, clock[ClockProperties.Position]);
    objectDraw(clock[ClockProperties.Object], program);
    glModelPop(program);
};

export const clockStep = (clock: Clock, deltaTime: number) => {
    clock[ClockProperties.Position][1] -= deltaTime * 0.2;
};

export const clockGetPosition = (clock: Clock) => clock[ClockProperties.Position];
