import * as modelDataRight from '../art/person.svg';
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
    animationResume,
    animationStart,
    animationStep,
    boundElementCreate,
} from './animation';
import { glModelPop, glModelPush, glModelScale, glModelTranslateVector, glSetGlobalOpacity, Program } from './gl';
import { Vec2 } from './glm';
import { Model, modelCreate, objectCreate } from './model';

let modelRight: Model;

export const personInit = (program: Program) => {
    modelRight = modelCreate(program, modelDataRight.model);
};

const enum PersonProperties {
    Position,
    RestAnimation,
    WalkAnimation,
    DeadAnimation,
    FacingLeft,
    Animatable,
    Dead,
    DeadTime,
    Opacity,
}

export type Person = {
    [PersonProperties.Position]: Vec2;
    [PersonProperties.RestAnimation]: Animation;
    [PersonProperties.WalkAnimation]: Animation;
    [PersonProperties.DeadAnimation]: Animation;
    [PersonProperties.FacingLeft]: boolean;
    [PersonProperties.Animatable]: Animatable;
    [PersonProperties.Dead]: boolean;
    [PersonProperties.DeadTime]: number;
    [PersonProperties.Opacity]: number;
};

export const personCreate = (position: Vec2): Person => {
    const REST_ARM_LEFT_1 = 0;
    const REST_ARM_LEFT_2 = -0.3;
    const REST_ARM_RIGHT_1 = 0;
    const REST_ARM_RIGHT_2 = -0.5;
    const leftArm1 = animationElementCreate(REST_ARM_LEFT_1);
    const leftArm2 = animationElementCreate(REST_ARM_LEFT_2);
    const rightArm1 = animationElementCreate(REST_ARM_RIGHT_1);
    const rightArm2 = animationElementCreate(REST_ARM_RIGHT_2);

    const REST_LEG_LEFT_1 = 0;
    const REST_LEG_LEFT_2 = 0;
    const REST_LEG_RIGHT_1 = 0;
    const REST_LEG_RIGHT_2 = 0;
    const leftLeg1 = animationElementCreate(REST_LEG_LEFT_1);
    const leftLeg2 = animationElementCreate(REST_LEG_LEFT_2);
    const rightLeg1 = animationElementCreate(REST_LEG_RIGHT_1);
    const rightLeg2 = animationElementCreate(REST_LEG_RIGHT_2);
    const body = animationElementCreate();

    const restAnimation = animationCreate([
        animationFrameCreate([
            animationFrameItemCreate(leftArm1, REST_ARM_LEFT_1, 0.005),
            animationFrameItemCreate(leftArm2, REST_ARM_LEFT_2, 0.005),
            animationFrameItemCreate(rightArm1, REST_ARM_RIGHT_1, 0.005),
            animationFrameItemCreate(rightArm2, REST_ARM_RIGHT_2, 0.005),
            animationFrameItemCreate(leftLeg1, REST_LEG_LEFT_1, 0.005),
            animationFrameItemCreate(leftLeg2, REST_LEG_LEFT_2, 0.005),
            animationFrameItemCreate(rightLeg1, REST_LEG_RIGHT_1, 0.005),
            animationFrameItemCreate(rightLeg2, REST_LEG_RIGHT_2, 0.005),
            animationFrameItemCreate(body, 0, 0.005),
        ]),
    ]);

    const person: Person = {
        [PersonProperties.Position]: position,
        [PersonProperties.Animatable]: animatableCreate(objectCreate(modelRight), [
            boundElementCreate(leftArm1, modelDataRight.leftArm1TransformPath),
            boundElementCreate(leftArm2, modelDataRight.leftArm3TransformPath),
            boundElementCreate(rightArm1, modelDataRight.rightArm1TransformPath),
            boundElementCreate(rightArm2, modelDataRight.rightArm3TransformPath),
            boundElementCreate(leftLeg1, modelDataRight.leftLeg1TransformPath),
            boundElementCreate(leftLeg2, modelDataRight.leftLeg2TransformPath),
            boundElementCreate(rightLeg1, modelDataRight.rightLeg1TransformPath),
            boundElementCreate(rightLeg2, modelDataRight.rightLeg2TransformPath),
            boundElementCreate(body, modelDataRight.bodyTransformPath),
        ]),
        [PersonProperties.RestAnimation]: restAnimation,
        [PersonProperties.WalkAnimation]: null,
        [PersonProperties.DeadAnimation]: null,
        [PersonProperties.FacingLeft]: false,
        [PersonProperties.Dead]: false,
        [PersonProperties.DeadTime]: 0,
        [PersonProperties.Opacity]: 0,
    };

    person[PersonProperties.DeadAnimation] = animationCreate([
        animationFrameCreate(
            [
                animationFrameItemCreate(leftArm1, -3.1, 0.007),
                animationFrameItemCreate(leftArm2, REST_ARM_LEFT_2, 0.005),
                animationFrameItemCreate(rightArm1, REST_ARM_RIGHT_1, 0.005),
                animationFrameItemCreate(rightArm2, -2.2, 0.003),
                animationFrameItemCreate(leftLeg1, REST_LEG_LEFT_1, 0.005),
                animationFrameItemCreate(leftLeg2, 0.1, 0.005),
                animationFrameItemCreate(rightLeg1, REST_LEG_RIGHT_1, 0.005),
                animationFrameItemCreate(rightLeg2, 0.4, 0.005),
                animationFrameItemCreate(body, 1.5, 0.003),
            ],
            () => animationStart(person[PersonProperties.DeadAnimation])
        ),
    ]);

    const walkSpeed = 0.55;
    person[PersonProperties.WalkAnimation] = animationCreate([
        animationFrameCreate([
            animationFrameItemCreate(leftArm1, -1, 0.01 * walkSpeed),
            animationFrameItemCreate(leftArm2, -0.2, 0.008 * walkSpeed),
            animationFrameItemCreate(rightArm1, 1, 0.01 * walkSpeed),
            animationFrameItemCreate(rightArm2, -1.1, 0.005 * walkSpeed),
            animationFrameItemCreate(leftLeg1, -1, 0.01 * walkSpeed),
            animationFrameItemCreate(leftLeg2, 0.2, 0.008 * walkSpeed),
            animationFrameItemCreate(rightLeg1, 1, 0.01 * walkSpeed),
            animationFrameItemCreate(rightLeg2, 1.1, 0.005 * walkSpeed),
        ]),
        animationFrameCreate(
            [
                animationFrameItemCreate(leftArm1, 1, 0.01 * walkSpeed),
                animationFrameItemCreate(leftArm2, -2, 0.008 * walkSpeed),
                animationFrameItemCreate(rightArm1, -1, 0.01 * walkSpeed),
                animationFrameItemCreate(rightArm2, -1.4, 0.005 * walkSpeed),
                animationFrameItemCreate(leftLeg1, 1, 0.01 * walkSpeed),
                animationFrameItemCreate(leftLeg2, 2, 0.008 * walkSpeed),
                animationFrameItemCreate(rightLeg1, -1.2, 0.01 * walkSpeed),
                animationFrameItemCreate(rightLeg2, 0.5, 0.005 * walkSpeed),
            ],
            () => animationStart(person[PersonProperties.WalkAnimation])
        ),
    ]);

    animationStart(person[PersonProperties.WalkAnimation]);

    return person;
};

export const personDraw = (person: Person, program: Program) => {
    glSetGlobalOpacity(program, person[PersonProperties.Opacity]);

    glModelPush(program);
    glModelTranslateVector(program, person[PersonProperties.Position]);
    if (person[PersonProperties.FacingLeft]) {
        glModelScale(program, -1, 1);
    }
    animatableDraw(person[PersonProperties.Animatable], program);
    glModelPop(program);
    glSetGlobalOpacity(program, 1);
};

export const personWalk = (person: Person) => {
    animationResume(person[PersonProperties.WalkAnimation]);
};

export const personIsDead = (person: Person) => {
    return person[PersonProperties.Dead];
};

export const personDie = (person: Person) => {
    animationStart(person[PersonProperties.DeadAnimation]);
    person[PersonProperties.Dead] = true;
};

export const personTurnLeft = (person: Person) => {
    person[PersonProperties.FacingLeft] = true;
};

export const personTurnRight = (person: Person) => {
    person[PersonProperties.FacingLeft] = false;
};

export const personGetDeadTime = (person: Person) => {
    return person[PersonProperties.DeadTime];
};

export const personSetPositionX = (person: Person, x: number) => {
    person[PersonProperties.Position][0] = x;
};

export const personStep = (person: Person, deltaTime: number) => {
    if (person[PersonProperties.Dead]) {
        person[PersonProperties.DeadTime] += deltaTime;
    } else {
        person[PersonProperties.Position][0] += (person[PersonProperties.FacingLeft] ? -1 : 1) * deltaTime * 0.2;
    }

    const opacityDirection = person[PersonProperties.DeadTime] > 1000 ? -1 : 1;
    person[PersonProperties.Opacity] = Math.max(
        0,
        Math.min(1, person[PersonProperties.Opacity] + 0.002 * deltaTime * opacityDirection)
    );

    animatableBeginStep(person[PersonProperties.Animatable]);

    if (person[PersonProperties.Dead]) {
        animationStep(person[PersonProperties.DeadAnimation], deltaTime);
    } else {
        animationStep(person[PersonProperties.WalkAnimation], deltaTime);
    }

    animatableStep(person[PersonProperties.Animatable]);
};

const PERSON_WIDTH = 50;
const PERSON_HEIGHT = 100;
export const personGetLeft = (person: Person) => person[PersonProperties.Position][0] - PERSON_WIDTH / 2;
export const personGetRight = (person: Person) => person[PersonProperties.Position][0] + PERSON_WIDTH / 2;
export const personGetPosition = (person: Person) => person[PersonProperties.Position];
export const personGetTop = (y: number) => y + PERSON_HEIGHT / 2;
export const personGetBottom = (y: number) => y;
