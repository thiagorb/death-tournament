import * as modelDataRight from '../art/death.svg';
import * as modelDataLeft from '../art/death_left.svg';
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
    animationIsRunning,
    animationPause,
    animationResume,
    animationStart,
    animationStep,
    boundElementCreate,
} from './animation';
import { glDrawRect, glModelPop, glModelPush, glModelScale, glModelTranslateVector, Program } from './gl';
import { Vec2, vectorCreate } from './glm';
import { Model, modelCreate, objectCreate } from './model';
import { Person, personGetBoundingLeft, personGetBoundingRight } from './person';

let modelRight: Model;
let modelLeft: Model;

export const deathInit = (program: Program) => {
    modelRight = modelCreate(program, modelDataRight.model);
    modelLeft = modelCreate(program, modelDataLeft.model);
};

const enum DeathProperties {
    Position,
    AttackCooldown,
    AnimatableRight,
    AnimatableLeft,
    AttackAnimation,
    RestAnimation,
    WalkAnimation,
    FacingLeft,
    Attacking,
}

export type Death = {
    [DeathProperties.Position]: Vec2;
    [DeathProperties.AttackCooldown]: number;
    [DeathProperties.AnimatableRight]: Animatable;
    [DeathProperties.AnimatableLeft]: Animatable;
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
        [DeathProperties.AttackCooldown]: 0,
        [DeathProperties.AnimatableRight]: animatableCreate(objectCreate(modelRight), [
            boundElementCreate(leftArm1, modelDataRight.leftArm1TransformPath),
            boundElementCreate(leftArm2, modelDataRight.leftArm2TransformPath),
            boundElementCreate(rightArm1, modelDataRight.rightArm1TransformPath),
            boundElementCreate(rightArm2, modelDataRight.rightArm2TransformPath),
        ]),
        [DeathProperties.AnimatableLeft]: animatableCreate(objectCreate(modelLeft), [
            boundElementCreate(leftArm1, modelDataLeft.leftArm1TransformPath),
            boundElementCreate(leftArm2, modelDataLeft.leftArm2TransformPath),
            boundElementCreate(rightArm1, modelDataLeft.rightArm1TransformPath),
            boundElementCreate(rightArm2, modelDataLeft.rightArm2TransformPath),
        ]),
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

export const deathDraw = (death: Death, program: Program) => {
    glModelPush(program);
    glModelTranslateVector(program, death[DeathProperties.Position]);
    if (death[DeathProperties.FacingLeft]) {
        glModelScale(program, -1, 1);
        animatableDraw(death[DeathProperties.AnimatableLeft], program);
    } else {
        animatableDraw(death[DeathProperties.AnimatableRight], program);
    }

    glModelPop(program);

    // glDrawRect(program, vectorCreate(getAttackLeft(death), 0), vectorCreate(ATTACK_WIDTH, 100));
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
    animatableBeginStep(death[DeathProperties.AnimatableRight]);

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

    animatableStep(death[death[DeathProperties.FacingLeft] ? DeathProperties.AnimatableLeft : DeathProperties.AnimatableRight]);
};

const ATTACK_GAP = 20;
const ATTACK_WIDTH = 70;
const ATTACK_LEFT = [-ATTACK_GAP - ATTACK_WIDTH, ATTACK_GAP];
export const deathIsHitting = (death: Death, person: Person) => {
    if (!death[DeathProperties.Attacking]) {
        return false;
    }

    const attackLeft = death[DeathProperties.Position][0] + ATTACK_LEFT[death[DeathProperties.FacingLeft] ? 0 : 1];
    const attackRight = attackLeft + ATTACK_WIDTH;
    return attackLeft < personGetBoundingRight(person) && attackRight >= personGetBoundingLeft(person);
};
