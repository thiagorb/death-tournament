import * as modelData from '../art/dog.svg';
import {
    Animatable,
    animatableBeginStep,
    animatableCreate,
    animatableDraw,
    animatableGetRootTransform,
    animatableTransform,
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
import { glSetGlobalOpacity, Program } from './gl';
import { matrixScale, matrixSetIdentity, matrixTranslateVector, Vec2 } from './glm';
import { Models, models, objectCreate } from './model';

const enum DogProperties {
    Position,
    Animatable,
    WalkAnimation,
    DeadAnimation,
    Health,
    FacingLeft,
    DeadTime,
    Opacity,
}

export type Dog = {
    [DogProperties.Position]: Vec2;
    [DogProperties.Animatable]: Animatable;
    [DogProperties.WalkAnimation]: Animation;
    [DogProperties.DeadAnimation]: Animation;
    [DogProperties.Health]: number;
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
        [DogProperties.Animatable]: animatableCreate(objectCreate(models[Models.Dog]), [
            boundElementCreate(frontLeftLeg, modelData.frontLeftLegComponentId),
            boundElementCreate(frontRightLeg, modelData.frontRightLegComponentId),
            boundElementCreate(backLeftLeg, modelData.backLeftLegComponentId),
            boundElementCreate(backRightLeg, modelData.backRightLegComponentId),
            boundElementCreate(tail, modelData.tailComponentId),
            boundElementCreate(bodyTranslate, modelData.bodyComponentId, AnimatedProperty.TranslationY),
            boundElementCreate(head, modelData.headComponentId),
        ]),
        [DogProperties.WalkAnimation]: null,
        [DogProperties.DeadAnimation]: null,
        [DogProperties.Health]: 1,
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
    return dog[DogProperties.Health] <= 0;
};

export const dogHit = (dog: Dog, power: number) => {
    const defense = 3;
    dog[DogProperties.Health] -= power / defense;
    if (dogIsDead(dog)) {
        animationStart(dog[DogProperties.DeadAnimation]);
    }
};

export const dogTurnLeft = (dog: Dog) => {
    dog[DogProperties.FacingLeft] = true;
};

export const dogDraw = (dog: Dog, program: Program) => {
    glSetGlobalOpacity(program, dog[DogProperties.Opacity]);

    const matrix = animatableGetRootTransform(dog[DogProperties.Animatable]);
    matrixSetIdentity(matrix);
    matrixTranslateVector(matrix, dog[DogProperties.Position]);
    if (dog[DogProperties.FacingLeft]) {
        matrixScale(matrix, -1, 1);
    }

    animatableTransform(dog[DogProperties.Animatable]);
    animatableDraw(dog[DogProperties.Animatable], program);

    glSetGlobalOpacity(program, 1);
};

export const dogStep = (dog: Dog, deltaTime: number) => {
    if (dogIsDead(dog)) {
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
};

const DOG_WIDTH = 40;
export const dogGetPosition = (dog: Dog) => dog[DogProperties.Position];
export const dogGetLeft = (dog: Dog) => dog[DogProperties.Position][0] - DOG_WIDTH / 2;
export const dogGetRight = (dog: Dog) => dog[DogProperties.Position][0] + DOG_WIDTH / 2;
