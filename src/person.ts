import * as modelData from '../art/person.svg';
import {
    Animatable,
    animatableBeginStep,
    animatableCreate,
    animatableDraw,
    animatableGetRootTransform,
    animatableTransform,
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
import { glSetGlobalOpacity, Program } from './gl';
import { matrixScale, matrixSetIdentity, matrixTranslateVector, Vec2 } from './glm';
import { Models, models, objectCreate } from './model';

const enum PersonProperties {
    Position,
    WalkAnimation,
    DeadAnimation,
    FacingLeft,
    Animatable,
    Health,
    DeadTime,
    Opacity,
}

export type Person = {
    [PersonProperties.Position]: Vec2;
    [PersonProperties.WalkAnimation]: Animation;
    [PersonProperties.DeadAnimation]: Animation;
    [PersonProperties.FacingLeft]: boolean;
    [PersonProperties.Animatable]: Animatable;
    [PersonProperties.Health]: number;
    [PersonProperties.DeadTime]: number;
    [PersonProperties.Opacity]: number;
};

export const personCreate = (position: Vec2): Person => {
    const leftArm1 = animationElementCreate();
    const leftArm2 = animationElementCreate();
    const rightArm1 = animationElementCreate();
    const rightArm2 = animationElementCreate();
    const leftLeg1 = animationElementCreate();
    const leftLeg2 = animationElementCreate();
    const rightLeg1 = animationElementCreate();
    const rightLeg2 = animationElementCreate();
    const body = animationElementCreate();

    const person: Person = {
        [PersonProperties.Position]: position,
        [PersonProperties.Animatable]: animatableCreate(objectCreate(models[Models.Person]), [
            boundElementCreate(leftArm1, modelData.leftArm1ComponentId),
            boundElementCreate(leftArm2, modelData.leftArm3ComponentId),
            boundElementCreate(rightArm1, modelData.rightArm1ComponentId),
            boundElementCreate(rightArm2, modelData.rightArm3ComponentId),
            boundElementCreate(leftLeg1, modelData.leftLeg1ComponentId),
            boundElementCreate(leftLeg2, modelData.leftLeg2ComponentId),
            boundElementCreate(rightLeg1, modelData.rightLeg1ComponentId),
            boundElementCreate(rightLeg2, modelData.rightLeg2ComponentId),
            boundElementCreate(body, modelData.bodyComponentId),
        ]),
        [PersonProperties.WalkAnimation]: null,
        [PersonProperties.DeadAnimation]: null,
        [PersonProperties.FacingLeft]: false,
        [PersonProperties.Health]: 1,
        [PersonProperties.DeadTime]: 0,
        [PersonProperties.Opacity]: 0,
    };

    person[PersonProperties.DeadAnimation] = animationCreate([
        animationFrameCreate(
            [
                animationFrameItemCreate(leftArm1, -3.1, 0.007),
                animationFrameItemCreate(leftArm2, -0.3, 0.005),
                animationFrameItemCreate(rightArm1, 0, 0.005),
                animationFrameItemCreate(rightArm2, -2.2, 0.003),
                animationFrameItemCreate(leftLeg1, 0, 0.005),
                animationFrameItemCreate(leftLeg2, 0.1, 0.005),
                animationFrameItemCreate(rightLeg1, 0, 0.005),
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

    const matrix = animatableGetRootTransform(person[PersonProperties.Animatable]);
    matrixSetIdentity(matrix);
    matrixTranslateVector(matrix, person[PersonProperties.Position]);
    if (person[PersonProperties.FacingLeft]) {
        matrixScale(matrix, -1, 1);
    }
    animatableTransform(person[PersonProperties.Animatable]);
    animatableDraw(person[PersonProperties.Animatable], program);

    glSetGlobalOpacity(program, 1);
};

export const personWalk = (person: Person) => {
    animationResume(person[PersonProperties.WalkAnimation]);
};

export const personIsDead = (person: Person) => {
    return person[PersonProperties.Health] <= 0;
};

export const personHit = (person: Person, power: number) => {
    const defense = 5;
    person[PersonProperties.Health] -= power / defense;
    if (personIsDead(person)) {
        animationStart(person[PersonProperties.DeadAnimation]);
    }
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
    if (personIsDead(person)) {
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

    if (personIsDead(person)) {
        animationStep(person[PersonProperties.DeadAnimation], deltaTime);
    } else {
        animationStep(person[PersonProperties.WalkAnimation], deltaTime);
    }
};

const PERSON_WIDTH = 50;
const PERSON_HEIGHT = 100;
export const personGetLeft = (person: Person) => person[PersonProperties.Position][0] - PERSON_WIDTH / 2;
export const personGetRight = (person: Person) => person[PersonProperties.Position][0] + PERSON_WIDTH / 2;
export const personGetPosition = (person: Person) => person[PersonProperties.Position];
export const personGetTop = (y: number) => y + PERSON_HEIGHT / 2;
export const personGetBottom = (y: number) => y;
