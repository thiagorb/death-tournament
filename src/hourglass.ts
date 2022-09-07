import * as modelData from '../art/hourglass.svg';
import {
    animatableBeginStep,
    animatableCreate,
    animatableDraw,
    animatableStep,
    animationCreate,
    animationElementCreate,
    animationFrameCreate,
    animationFrameItemCreate,
    animationStart,
    animationStep,
    boundElementCreate,
} from './animation';
import { glModelPop, glModelPush, glModelTranslateVector, Program } from './gl';
import { Vec2 } from './glm';
import { Model, modelCreate, objectCreate } from './model';

let model: Model;

export const hourglassInit = (program: Program) => {
    model = modelCreate(program, modelData.model);
};

const enum HourglassProperties {
    Position,
    Animatable,
    Animation,
}

export type Hourglass = ReturnType<typeof hourglassCreate>;

export const hourglassCreate = (position: Vec2) => {
    const glass = animationElementCreate();

    const hourglass = {
        [HourglassProperties.Position]: position,
        [HourglassProperties.Animatable]: animatableCreate(objectCreate(model), [
            boundElementCreate(glass, modelData.glassTransformPath),
        ]),
        [HourglassProperties.Animation]: animationCreate([
            animationFrameCreate([animationFrameItemCreate(glass, -0.6, 0.003)]),
            animationFrameCreate([animationFrameItemCreate(glass, 0.6, 0.003)], () =>
                animationStart(hourglass[HourglassProperties.Animation])
            ),
        ]),
    };

    animationStart(hourglass[HourglassProperties.Animation]);

    return hourglass;
};

export const hourglassDraw = (hourglass: Hourglass, program: Program) => {
    glModelPush(program);
    glModelTranslateVector(program, hourglass[HourglassProperties.Position]);
    animatableDraw(hourglass[HourglassProperties.Animatable], program);
    glModelPop(program);
};

export const hourglassStep = (hourglass: Hourglass, deltaTime: number) => {
    animatableBeginStep(hourglass[HourglassProperties.Animatable]);
    animationStep(hourglass[HourglassProperties.Animation], deltaTime);
    animatableStep(hourglass[HourglassProperties.Animatable]);
    hourglass[HourglassProperties.Position][1] -= deltaTime * 0.2;
};

export const hourglassGetPosition = (hourglass: Hourglass) => hourglass[HourglassProperties.Position];
