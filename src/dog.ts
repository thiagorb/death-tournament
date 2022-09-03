import * as modelData from '../art/dog.svg';
import {
    Animatable,
    animatableBeginStep,
    animatableCreate,
    animatableDraw,
    animatableStep,
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
}

export type Dog = {
    [DogProperties.Position]: Vec2;
    [DogProperties.Animatable]: Animatable;
    [DogProperties.WalkAnimation]: Animation;
};

export const dogCreate = (position: Vec2): Dog => {
    const frontLeftLeg = animationElementCreate();
    const frontRightLeg = animationElementCreate();
    const backLeftLeg = animationElementCreate();
    const backRightLeg = animationElementCreate();

    const dog: Dog = {
        [DogProperties.Position]: position,
        [DogProperties.Animatable]: animatableCreate(objectCreate(model), [
            boundElementCreate(frontLeftLeg, modelData.frontLeftLegTransformPath),
            boundElementCreate(frontRightLeg, modelData.frontRightLegTransformPath),
            boundElementCreate(backLeftLeg, modelData.backLeftLegTransformPath),
            boundElementCreate(backRightLeg, modelData.backRightLegTransformPath),
        ]),
        [DogProperties.WalkAnimation]: null,
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

    animationStart(dog[DogProperties.WalkAnimation]);

    return dog;
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

    animationStep(dog[DogProperties.WalkAnimation], deltaTime);

    animatableStep(dog[DogProperties.Animatable]);
};

export const dogGetPosition = (dog: Dog) => dog[DogProperties.Position];
