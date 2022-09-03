import * as modelData from '../art/dog.svg';
import {
    Animatable,
    animatableBeginStep,
    animatableCreate,
    animatableDraw,
    animatableStep,
    AnimatedProperty,
    Animation,
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
import { Model, modelCreate, Object, objectCreate, objectDraw } from './model';

let model: Model;

export const dogInit = (program: Program) => {
    model = modelCreate(program, modelData.model);
};

const enum DogProperties {
    Position,
    Animatable,
    WalkAnimation,
    DeadAnimation,
    Dead,
    FacingLeft,
}

export type Dog = {
    [DogProperties.Position]: Vec2;
    [DogProperties.Animatable]: Animatable;
    [DogProperties.WalkAnimation]: Animation;
    [DogProperties.DeadAnimation]: Animation;
    [DogProperties.Dead]: boolean;
    [DogProperties.FacingLeft]: boolean;
};

export const dogCreate = (position: Vec2): Dog => {
    const frontLeftLeg = animationElementCreate();
    const frontRightLeg = animationElementCreate();
    const backLeftLeg = animationElementCreate();
    const backRightLeg = animationElementCreate();
    const tail = animationElementCreate();
    const body = animationElementCreate();
    const head = animationElementCreate();

    const dog: Dog = {
        [DogProperties.Position]: position,
        [DogProperties.Animatable]: animatableCreate(objectCreate(model), [
            boundElementCreate(frontLeftLeg, modelData.frontLeftLegTransformPath),
            boundElementCreate(frontRightLeg, modelData.frontRightLegTransformPath),
            boundElementCreate(backLeftLeg, modelData.backLeftLegTransformPath),
            boundElementCreate(backRightLeg, modelData.backRightLegTransformPath),
            boundElementCreate(tail, modelData.tailTransformPath),
            boundElementCreate(body, modelData.bodyTransformPath, AnimatedProperty.TranslationY),
            boundElementCreate(head, modelData.headTransformPath),
        ]),
        [DogProperties.WalkAnimation]: null,
        [DogProperties.DeadAnimation]: null,
        [DogProperties.Dead]: false,
        [DogProperties.FacingLeft]: false,
    };

    dog[DogProperties.WalkAnimation] = animationCreate([
        animationFrameCreate([
            animationFrameItemCreate(frontLeftLeg, 0.5, 0.02),
            animationFrameItemCreate(frontRightLeg, -0.5, 0.02),
            animationFrameItemCreate(backLeftLeg, -0.5, 0.02),
            animationFrameItemCreate(backRightLeg, 0.5, 0.02),
        ]),
        animationFrameCreate(
            [
                animationFrameItemCreate(frontLeftLeg, -0.5, 0.02),
                animationFrameItemCreate(frontRightLeg, 0.5, 0.02),
                animationFrameItemCreate(backLeftLeg, 0.5, 0.02),
                animationFrameItemCreate(backRightLeg, -0.5, 0.02),
            ],
            () => animationStart(dog[DogProperties.WalkAnimation])
        ),
    ]);

    dog[DogProperties.DeadAnimation] = animationCreate([
        animationFrameCreate(
            [
                animationFrameItemCreate(frontLeftLeg, -1.5, 0.02),
                animationFrameItemCreate(frontRightLeg, -1.5, 0.02),
                animationFrameItemCreate(backLeftLeg, -1.5, 0.02),
                animationFrameItemCreate(backRightLeg, -1.5, 0.02),
                animationFrameItemCreate(tail, -1.5, 0.02),
                animationFrameItemCreate(head, 0.8, 0.02),
                animationFrameItemCreate(body, -18, 0.2),
            ],
            () => animationStart(dog[DogProperties.DeadAnimation])
        ),
    ]);

    animationStart(dog[DogProperties.WalkAnimation]);

    return dog;
};

export const dogIsDead = (dog: Dog) => {
    return dog[DogProperties.Dead];
};

export const dogDie = (dog: Dog) => {
    animationStart(dog[DogProperties.DeadAnimation]);
    dog[DogProperties.Dead] = true;
};

export const dogDraw = (dog: Dog, program: Program) => {
    glModelPush(program);
    glModelTranslateVector(program, dog[DogProperties.Position]);
    animatableDraw(dog[DogProperties.Animatable], program);
    glModelPop(program);
};

export const dogStep = (dog: Dog, deltaTime: number) => {
    // dog[DogProperties.Position][1] -= deltaTime * 0.2;
    animatableBeginStep(dog[DogProperties.Animatable]);

    animationStep(dog[DogProperties.DeadAnimation], deltaTime);
    animationStep(dog[DogProperties.WalkAnimation], deltaTime);

    animatableStep(dog[DogProperties.Animatable]);
};

const DOG_WIDTH = 40;
export const dogGetPosition = (dog: Dog) => dog[DogProperties.Position];
export const dogGetLeft = (dog: Dog) => dog[DogProperties.Position][0] - DOG_WIDTH / 2;
export const dogGetRight = (dog: Dog) => dog[DogProperties.Position][0] + DOG_WIDTH / 2;
