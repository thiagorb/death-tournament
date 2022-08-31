import * as modelDataRight from '../art/death.svg';
import * as modelDataLeft from '../art/death_left.svg';
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
    animationPause,
    animationResume,
    animationStart,
    animationStep,
} from './animation';
import { glDrawBoundingBox, glDrawRect, glModelPop, glModelPush, glModelScale, glModelTranslateVector, Program } from './gl';
import { matrixRotate, matrixSetIdentity, Vec2, vectorCreate } from './glm';
import { Model, modelCreate, Object, objectCreate, objectDraw, objectGetComponentTransform } from './model';
import { Person, personGetBoundingLeft, personGetBoundingRight } from './person';

let modelRight: Model;
let modelLeft: Model;

export const deathInit = (program: Program) => {
    modelRight = modelCreate(program, modelDataRight.model);
    modelLeft = modelCreate(program, modelDataLeft.model);
};

const enum DeathProperties {
    Position,
    ObjectRight,
    ObjectLeft,
    AttackCooldown,
    LeftArmRotation1,
    LeftArmRotation2,
    RightArmRotation1,
    RightArmRotation2,
    AttackAnimation,
    RestAnimation,
    WalkAnimation,
    FacingLeft,
    Attacking,
}

export type Death = {
    [DeathProperties.Position]: Vec2;
    [DeathProperties.ObjectRight]: Object;
    [DeathProperties.ObjectLeft]: Object;
    [DeathProperties.AttackCooldown]: number;
    [DeathProperties.LeftArmRotation1]: AnimationElement;
    [DeathProperties.LeftArmRotation2]: AnimationElement;
    [DeathProperties.RightArmRotation1]: AnimationElement;
    [DeathProperties.RightArmRotation2]: AnimationElement;
    [DeathProperties.AttackAnimation]: Animation;
    [DeathProperties.RestAnimation]: Animation;
    [DeathProperties.WalkAnimation]: Animation;
    [DeathProperties.FacingLeft]: boolean;
    [DeathProperties.Attacking]: boolean;
};

export const deathCreate = (): Death => {
    const REST_LEFT_1 = 0;
    const REST_LEFT_2 = -1.5;
    const REST_RIGHT_1 = 0;
    const REST_RIGHT_2 = -0.5;
    const leftArm1 = animationElementCreate(REST_LEFT_1);
    const leftArm2 = animationElementCreate(REST_LEFT_2);
    const rightArm1 = animationElementCreate(REST_RIGHT_1);
    const rightArm2 = animationElementCreate(REST_RIGHT_2);

    const restPositionLeftArm = [
        animationFrameItemCreate(leftArm1, REST_LEFT_1, 0.005),
        animationFrameItemCreate(leftArm2, REST_LEFT_2, 0.005),
    ];
    const restPosition = [
        ...restPositionLeftArm,
        animationFrameItemCreate(rightArm1, REST_RIGHT_1, 0.005),
        animationFrameItemCreate(rightArm2, REST_RIGHT_2, 0.005),
    ];

    const restAnimation = animationCreate([animationFrameCreate(restPosition)]);

    const walkAnimation = animationCreate([
        animationFrameCreate([
            animationFrameItemCreate(leftArm1, -1, 0.01),
            animationFrameItemCreate(leftArm2, -0.2, 0.008),
            animationFrameItemCreate(rightArm1, 1, 0.01),
            animationFrameItemCreate(rightArm2, -0.1, 0.005),
        ]),
        animationFrameCreate([
            animationFrameItemCreate(leftArm1, 1, 0.01),
            animationFrameItemCreate(leftArm2, -2, 0.008),
            animationFrameItemCreate(rightArm1, -1, 0.01),
            animationFrameItemCreate(rightArm2, -0.4, 0.005),
        ]),
    ]);

    const death: Death = {
        [DeathProperties.Position]: vectorCreate(),
        [DeathProperties.ObjectRight]: objectCreate(modelRight),
        [DeathProperties.ObjectLeft]: objectCreate(modelLeft),
        [DeathProperties.AttackCooldown]: 0,
        [DeathProperties.LeftArmRotation1]: leftArm1,
        [DeathProperties.LeftArmRotation2]: leftArm2,
        [DeathProperties.RightArmRotation1]: rightArm1,
        [DeathProperties.RightArmRotation2]: rightArm2,
        [DeathProperties.AttackAnimation]: null,
        [DeathProperties.RestAnimation]: restAnimation,
        [DeathProperties.WalkAnimation]: walkAnimation,
        [DeathProperties.FacingLeft]: false,
        [DeathProperties.Attacking]: false,
    };

    const attackPrepareSpeed = 0.02;
    const attackSpeed = attackPrepareSpeed * 2;
    death[DeathProperties.AttackAnimation] = animationCreate([
        animationFrameCreate(
            [animationFrameItemCreate(leftArm1, -3, attackPrepareSpeed), animationFrameItemCreate(leftArm2, -2, attackPrepareSpeed)],
            () => (death[DeathProperties.Attacking] = true)
        ),
        animationFrameCreate(
            [animationFrameItemCreate(leftArm1, -0.7, attackSpeed), animationFrameItemCreate(leftArm2, 0, attackSpeed)],
            () => (death[DeathProperties.Attacking] = false)
        ),
        animationFrameCreate(restPositionLeftArm),
    ]);

    return death;
};

export const deathDraw = (program: Program, death: Death) => {
    glModelPush(program);
    glModelTranslateVector(program, death[DeathProperties.Position]);
    if (death[DeathProperties.FacingLeft]) {
        glModelScale(program, -1, 1);
        objectDraw(program, death[DeathProperties.ObjectLeft]);
    } else {
        objectDraw(program, death[DeathProperties.ObjectRight]);
    }

    glModelPop(program);

    glDrawRect(program, vectorCreate(getAttackLeft(death), 0), vectorCreate(ATTACK_WIDTH, 100));
};

const ATTACK_COOLDOWN_TIME = 100;

export const deathAttack = (death: Death) => {
    if (animationIsRunning(death[DeathProperties.AttackAnimation]) || death[DeathProperties.AttackCooldown] > 0) {
        return;
    }

    animationStart(death[DeathProperties.AttackAnimation]);
};

const moveSpeed = 0.3;
export const deathWalk = (death: Death, deltaTime: number, left: boolean) => {
    death[DeathProperties.Position][0] += moveSpeed * deltaTime * (left ? -1 : 1);
    animationResume(death[DeathProperties.WalkAnimation]);
    death[DeathProperties.FacingLeft] = left;
};

export const deathTurnRight = (death: Death) => {
    death[DeathProperties.FacingLeft] = false;
};

export const deathIsAttacking = (death: Death) => {
    return death[DeathProperties.Attacking];
};

export const deathStep = (death: Death, deltaTime: number) => {
    animationElementBeginStep(death[DeathProperties.LeftArmRotation1]);
    animationElementBeginStep(death[DeathProperties.LeftArmRotation2]);
    animationElementBeginStep(death[DeathProperties.RightArmRotation1]);
    animationElementBeginStep(death[DeathProperties.RightArmRotation2]);

    death[DeathProperties.AttackCooldown] = Math.max(0, death[DeathProperties.AttackCooldown] - deltaTime);
    if (animationStep(death[DeathProperties.AttackAnimation], deltaTime)) {
        death[DeathProperties.AttackCooldown] = ATTACK_COOLDOWN_TIME;
    }
    animationStep(death[DeathProperties.WalkAnimation], deltaTime);

    if (!animationIsRunning(death[DeathProperties.RestAnimation])) {
        animationStart(death[DeathProperties.RestAnimation]);
    }
    animationStep(death[DeathProperties.RestAnimation], deltaTime);

    animationPause(death[DeathProperties.WalkAnimation]);

    const object = death[death[DeathProperties.FacingLeft] ? DeathProperties.ObjectLeft : DeathProperties.ObjectRight];
    const model = death[DeathProperties.FacingLeft] ? modelDataLeft : modelDataRight;
    const leftArm1Transform = objectGetComponentTransform(object, model.leftArm1TransformPath);
    const leftArm2Transform = objectGetComponentTransform(object, model.leftArm2TransformPath);
    const rightArm1Transform = objectGetComponentTransform(object, model.rightArm1TransformPath);
    const rightArm2Transform = objectGetComponentTransform(object, model.rightArm2TransformPath);
    matrixSetIdentity(leftArm1Transform);
    matrixSetIdentity(leftArm2Transform);
    matrixSetIdentity(rightArm1Transform);
    matrixSetIdentity(rightArm2Transform);
    matrixRotate(leftArm1Transform, animationElementGetValue(death[DeathProperties.LeftArmRotation1]));
    matrixRotate(leftArm2Transform, animationElementGetValue(death[DeathProperties.LeftArmRotation2]));
    matrixRotate(rightArm1Transform, animationElementGetValue(death[DeathProperties.RightArmRotation1]));
    matrixRotate(rightArm2Transform, animationElementGetValue(death[DeathProperties.RightArmRotation2]));
};

const ATTACK_WIDTH = 90;
const getAttackLeft = (death: Death) => death[DeathProperties.Position][0] - (death[DeathProperties.FacingLeft] ? ATTACK_WIDTH : 0);
export const deathIsHitting = (death: Death, person: Person) => {
    if (!death[DeathProperties.Attacking]) {
        return false;
    }

    const attackLeft = getAttackLeft(death);
    const attackRight = attackLeft + ATTACK_WIDTH;
    return attackLeft < personGetBoundingRight(person) && attackRight >= personGetBoundingLeft(person);
};
