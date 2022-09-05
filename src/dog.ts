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
import { glModelPop, glModelPush, glModelScale, glModelTranslateVector, glSetGlobalOpacity, Program } from './gl';
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
    DeadTime,
    Opacity,
}

export type Dog = {
    [DogProperties.Position]: Vec2;
    [DogProperties.Animatable]: Animatable;
    [DogProperties.WalkAnimation]: Animation;
    [DogProperties.DeadAnimation]: Animation;
    [DogProperties.Dead]: boolean;
    [DogProperties.FacingLeft]: boolean;
    [DogProperties.DeadTime]: number;
    [DogProperties.Opacity]: number;
};

export const dogGetDeadTime = (dog: Dog) => {
    return dog[DogProperties.DeadTime];
};

export const dogCreate = (position: Vec2): Dog => {
    const frontLeftLeg = animationElementCreate();
    const frontRightLeg = animationElementCreate();
    const backLeftLeg = animationElementCreate();
    const backRightLeg = animationElementCreate();
    const tail = animationElementCreate();
    const bodyTranslate = animationElementCreate();
    const head = animationElementCreate();

    const dog: Dog = {
        [DogProperties.Position]: position,
        [DogProperties.Animatable]: animatableCreate(objectCreate(model), [
            boundElementCreate(frontLeftLeg, modelData.frontLeftLegTransformPath),
            boundElementCreate(frontRightLeg, modelData.frontRightLegTransformPath),
            boundElementCreate(backLeftLeg, modelData.backLeftLegTransformPath),
            boundElementCreate(backRightLeg, modelData.backRightLegTransformPath),
            boundElementCreate(tail, modelData.tailTransformPath),
            boundElementCreate(bodyTranslate, modelData.bodyTransformPath, AnimatedProperty.TranslationY),
            boundElementCreate(head, modelData.headTransformPath),
        ]),
        [DogProperties.WalkAnimation]: null,
        [DogProperties.DeadAnimation]: null,
        [DogProperties.Dead]: false,
        [DogProperties.FacingLeft]: false,
        [DogProperties.DeadTime]: 0,
        [DogProperties.Opacity]: 0,
    };

    const walkspeed = 0.01;
    dog[DogProperties.WalkAnimation] = animationCreate([
        animationFrameCreate([
            animationFrameItemCreate(frontLeftLeg, 0.5, walkspeed),
            animationFrameItemCreate(frontRightLeg, -0.5, walkspeed),
            animationFrameItemCreate(backLeftLeg, -0.5, walkspeed),
            animationFrameItemCreate(backRightLeg, 0.5, walkspeed),
        ]),
        animationFrameCreate(
            [
                animationFrameItemCreate(frontLeftLeg, -0.5, walkspeed),
                animationFrameItemCreate(frontRightLeg, 0.5, walkspeed),
                animationFrameItemCreate(backLeftLeg, 0.5, walkspeed),
                animationFrameItemCreate(backRightLeg, -0.5, walkspeed),
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
                animationFrameItemCreate(head, 1, 0.02),
                animationFrameItemCreate(bodyTranslate, -18, 0.2),
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

export const dogTurnLeft = (dog: Dog) => {
    dog[DogProperties.FacingLeft] = true;
};

export const dogDraw = (dog: Dog, program: Program) => {
    glSetGlobalOpacity(program, dog[DogProperties.Opacity]);
    glModelPush(program);
    glModelTranslateVector(program, dog[DogProperties.Position]);
    if (dog[DogProperties.FacingLeft]) {
        glModelScale(program, -1, 1);
    }
    animatableDraw(dog[DogProperties.Animatable], program);
    glModelPop(program);
    glSetGlobalOpacity(program, 1);
};

export const dogStep = (dog: Dog, deltaTime: number) => {
    if (dog[DogProperties.Dead]) {
        dog[DogProperties.DeadTime] += deltaTime;
    } else {
        dog[DogProperties.Position][0] += (dog[DogProperties.FacingLeft] ? -1 : 1) * deltaTime * 0.2;
    }

    const opacityDirection = dog[DogProperties.DeadTime] > 1000 ? -1 : 1;
    dog[DogProperties.Opacity] = Math.max(
        0,
        Math.min(1, dog[DogProperties.Opacity] + 0.002 * deltaTime * opacityDirection)
    );

    animatableBeginStep(dog[DogProperties.Animatable]);

    animationStep(dog[DogProperties.DeadAnimation], deltaTime);
    animationStep(dog[DogProperties.WalkAnimation], deltaTime);

    animatableStep(dog[DogProperties.Animatable]);
};

const DOG_WIDTH = 40;
export const dogGetPosition = (dog: Dog) => dog[DogProperties.Position];
export const dogGetLeft = (dog: Dog) => dog[DogProperties.Position][0] - DOG_WIDTH / 2;
export const dogGetRight = (dog: Dog) => dog[DogProperties.Position][0] + DOG_WIDTH / 2;
