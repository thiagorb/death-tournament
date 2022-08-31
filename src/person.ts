import { glModelMultiply, glModelPop, glModelPush, glModelTranslate, glModelTranslateVector, Program } from './gl';
import * as modelDataRight from '../art/person.svg';
import { Model, modelCreate, Object, objectCreate, objectDraw, objectGetComponentTransform } from './model';
import { Matrix3, matrixCreate, matrixRotate, matrixScale, matrixSetIdentity, Vec2, vectorCreate } from './glm';
import {
    Animation,
    animationCreate,
    AnimationElement,
    animationElementBeginStep,
    animationElementCreate,
    animationElementGetValue,
    animationFrameCreate,
    animationFrameItemCreate,
    animationIsRunning,
    animationResume,
    animationStart,
    animationStep,
} from './animation';

let modelRight: Model;

export const personInit = (program: Program) => {
    modelRight = modelCreate(program, modelDataRight.model);
};

const enum PersonProperties {
    Position,
    ObjectRight,
    AnimationElements,
    RestAnimation,
    WalkAnimation,
    DeadAnimation,
    FacingLeft,
}

const enum BoundElementProperties {
    AnimationElement,
    TransformPath,
}

type BoundElement = {
    [BoundElementProperties.AnimationElement]: AnimationElement;
    [BoundElementProperties.TransformPath]: Array<number>;
};

export type Person = {
    [PersonProperties.Position]: Vec2;
    [PersonProperties.ObjectRight]: Object;
    [PersonProperties.AnimationElements]: Array<BoundElement>;
    [PersonProperties.RestAnimation]: Animation;
    [PersonProperties.WalkAnimation]: Animation;
    [PersonProperties.DeadAnimation]: Animation;
    [PersonProperties.FacingLeft]: boolean;
};

const boundElementCreate = (element: AnimationElement, transformPath: Array<number>) => ({
    [BoundElementProperties.AnimationElement]: element,
    [BoundElementProperties.TransformPath]: transformPath,
});

export const personCreate = (): Person => {
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

    const deadAnimation = animationCreate([
        animationFrameCreate([
            animationFrameItemCreate(leftArm1, -3.1, 0.007),
            animationFrameItemCreate(leftArm2, REST_ARM_LEFT_2, 0.005),
            animationFrameItemCreate(rightArm1, REST_ARM_RIGHT_1, 0.005),
            animationFrameItemCreate(rightArm2, -2.2, 0.003),
            animationFrameItemCreate(leftLeg1, REST_LEG_LEFT_1, 0.005),
            animationFrameItemCreate(leftLeg2, 0.1, 0.005),
            animationFrameItemCreate(rightLeg1, REST_LEG_RIGHT_1, 0.005),
            animationFrameItemCreate(rightLeg2, 0.4, 0.005),
            animationFrameItemCreate(body, 1.5, 0.003),
        ]),
    ]);

    const walkAnimation = animationCreate([
        animationFrameCreate([
            animationFrameItemCreate(leftArm1, -1, 0.01),
            animationFrameItemCreate(leftArm2, -0.2, 0.008),
            animationFrameItemCreate(rightArm1, 1, 0.01),
            animationFrameItemCreate(rightArm2, -1.1, 0.005),
            animationFrameItemCreate(leftLeg1, -1, 0.01),
            animationFrameItemCreate(leftLeg2, 0.2, 0.008),
            animationFrameItemCreate(rightLeg1, 1, 0.01),
            animationFrameItemCreate(rightLeg2, 1.1, 0.005),
        ]),
        animationFrameCreate([
            animationFrameItemCreate(leftArm1, 1, 0.01),
            animationFrameItemCreate(leftArm2, -2, 0.008),
            animationFrameItemCreate(rightArm1, -1, 0.01),
            animationFrameItemCreate(rightArm2, -0.4, 0.005),
            animationFrameItemCreate(leftLeg1, 1, 0.01),
            animationFrameItemCreate(leftLeg2, 2, 0.008),
            animationFrameItemCreate(rightLeg1, -1.2, 0.01),
            animationFrameItemCreate(rightLeg2, 0.5, 0.005),
        ]),
    ]);

    return {
        [PersonProperties.Position]: vectorCreate(),
        [PersonProperties.ObjectRight]: objectCreate(modelRight),
        [PersonProperties.AnimationElements]: [
            boundElementCreate(leftArm1, modelDataRight.leftArm1TransformPath),
            boundElementCreate(leftArm2, modelDataRight.leftArm3TransformPath),
            boundElementCreate(rightArm1, modelDataRight.rightArm1TransformPath),
            boundElementCreate(rightArm2, modelDataRight.rightArm3TransformPath),
            boundElementCreate(leftLeg1, modelDataRight.leftLeg1TransformPath),
            boundElementCreate(leftLeg2, modelDataRight.leftLeg2TransformPath),
            boundElementCreate(rightLeg1, modelDataRight.rightLeg1TransformPath),
            boundElementCreate(rightLeg2, modelDataRight.rightLeg2TransformPath),
            boundElementCreate(body, modelDataRight.bodyTransformPath),
        ],
        [PersonProperties.RestAnimation]: restAnimation,
        [PersonProperties.WalkAnimation]: walkAnimation,
        [PersonProperties.DeadAnimation]: deadAnimation,
        [PersonProperties.FacingLeft]: false,
    };
};

export const personDraw = (program: Program, person: Person) => {
    glModelPush(program);
    glModelTranslateVector(program, person[PersonProperties.Position]);
    objectDraw(program, person[PersonProperties.ObjectRight]);
    glModelPop(program);
};

export const personWalk = (person: Person) => {
    animationResume(person[PersonProperties.WalkAnimation]);
};

export const personDie = (person: Person) => {
    animationStart(person[PersonProperties.DeadAnimation]);
};

export const personTurnLeft = (person: Person) => {
    person[PersonProperties.FacingLeft] = true;
};

export const personTurnRight = (person: Person) => {
    person[PersonProperties.FacingLeft] = false;
};

export const personStep = (person: Person, deltaTime: number) => {
    for (const boundElement of person[PersonProperties.AnimationElements]) {
        animationElementBeginStep(boundElement[BoundElementProperties.AnimationElement]);
    }

    if (animationStep(person[PersonProperties.DeadAnimation], deltaTime)) {
        animationStart(person[PersonProperties.DeadAnimation]);
    }

    animationStep(person[PersonProperties.WalkAnimation], deltaTime);

    if (!animationIsRunning(person[PersonProperties.WalkAnimation])) {
        animationStart(person[PersonProperties.WalkAnimation]);
    }

    if (!animationIsRunning(person[PersonProperties.RestAnimation])) {
        animationStart(person[PersonProperties.RestAnimation]);
    }
    animationStep(person[PersonProperties.RestAnimation], deltaTime);

    for (const boundElement of person[PersonProperties.AnimationElements]) {
        const transform = objectGetComponentTransform(
            person[PersonProperties.ObjectRight],
            boundElement[BoundElementProperties.TransformPath]
        );
        matrixSetIdentity(transform);
        matrixRotate(transform, animationElementGetValue(boundElement[BoundElementProperties.AnimationElement]));
    }
};

const PERSON_WIDTH = 50;
const PERSON_HEIGHT = 100;
export const personGetBoundingLeft = (person: Person) => person[PersonProperties.Position][0] - PERSON_WIDTH / 2;
export const personGetBoundingRight = (person: Person) => person[PersonProperties.Position][0] + PERSON_WIDTH / 2;
export const personGetBoundingTop = (y: number) => y + PERSON_HEIGHT / 2;
export const personGetBoundingBottom = (y: number) => y;
