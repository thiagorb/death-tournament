import * as modelData from '../art/dog.svg';
import { glModelPop, glModelPush, glModelTranslateVector, Program } from './gl';
import { Vec2 } from './glm';
import { Model, modelCreate, Object, objectCreate, objectDraw } from './model';

let model: Model;

export const dogInit = (program: Program) => {
    model = modelCreate(program, modelData.model);
};

const enum DogProperties {
    Position,
    Object,
}

export type Dog = {
    [DogProperties.Position]: Vec2;
    [DogProperties.Object]: Object;
};

export const dogCreate = (position: Vec2): Dog => ({
    [DogProperties.Position]: position,
    [DogProperties.Object]: objectCreate(model),
});

export const dogDraw = (dog: Dog, program: Program) => {
    glModelPush(program);
    glModelTranslateVector(program, dog[DogProperties.Position]);
    objectDraw(dog[DogProperties.Object], program);
    glModelPop(program);
};

export const dogStep = (dog: Dog, deltaTime: number) => {
    // dog[DogProperties.Position][1] -= deltaTime * 0.2;
};

export const dogGetPosition = (dog: Dog) => dog[DogProperties.Position];
