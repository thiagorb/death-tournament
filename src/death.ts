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
import { glModelPop, glModelPush, glModelScale, glModelTranslateVector, glSetGlobalOpacity, Program } from './gl';
import { Vec2 } from './glm';
import { Hourglass, hourglassGetPosition } from './hourglass';
import { Model, modelCreate, objectCreate } from './model';

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
    AttackingTime,
    Fading,
    Opacity,
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
    [DeathProperties.AttackingTime]: number;
    [DeathProperties.Fading]: boolean;
    [DeathProperties.Opacity]: number;
};

export const deathCreate = (position: Vec2): Death => {
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
        [DeathProperties.Position]: position,
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
        [DeathProperties.AttackingTime]: 0,
        [DeathProperties.Fading]: false,
        [DeathProperties.Opacity]: 0,
    };

    const attackPrepareSpeed = 0.02;
    const attackSpeed = attackPrepareSpeed * 2;
    death[DeathProperties.AttackAnimation] = animationCreate([
        animationFrameCreate(
            [
                animationFrameItemCreate(leftArm1, -3, attackPrepareSpeed),
                animationFrameItemCreate(leftArm2, -2, attackPrepareSpeed),
            ],
            () => ((death[DeathProperties.Attacking] = true), (death[DeathProperties.AttackingTime] = 0))
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
    glSetGlobalOpacity(program, death[DeathProperties.Opacity]);
    glModelPush(program);
    glModelTranslateVector(program, death[DeathProperties.Position]);
    if (death[DeathProperties.FacingLeft]) {
        glModelScale(program, -1, 1);
        animatableDraw(death[DeathProperties.AnimatableLeft], program);
    } else {
        animatableDraw(death[DeathProperties.AnimatableRight], program);
    }

    glModelPop(program);
    glSetGlobalOpacity(program, 1);

    // glDrawRect(program, vectorCreate(getAttackLeft(death), 0), vectorCreate(ATTACK_WIDTH, 100));
    //updateHtmlBb(death);
};

/*
const updateHtmlBb = (death: Death) => {
    const bb = document.querySelector('#death-bb') as HTMLElement;
    bb.style.width = `${DEATH_WIDTH}px`;
    bb.style.height = `${DEATH_HEIGHT}px`;
    bb.style.left = `calc(50% + ${death[DeathProperties.Position][0] - DEATH_WIDTH / 2}px)`;
    bb.style.top = `calc(50% - ${death[DeathProperties.Position][1] + DEATH_HEIGHT}px)`;
};
*/

const ATTACK_COOLDOWN_TIME = 100;

export const deathAttack = (death: Death) => {
    if (animationIsRunning(death[DeathProperties.AttackAnimation]) || death[DeathProperties.AttackCooldown] > 0) {
        return;
    }

    animationStart(death[DeathProperties.AttackAnimation]);
};

const moveSpeed = 0.3;
export const deathWalk = (death: Death, deltaTime: number, left: boolean) => {
    const newX = death[DeathProperties.Position][0] + moveSpeed * deltaTime * (left ? -1 : 1);
    death[DeathProperties.Position][0] = Math.max(-500, Math.min(500, newX));
    animationResume(death[DeathProperties.WalkAnimation]);
    death[DeathProperties.FacingLeft] = left;
};

export const deathTurnRight = (death: Death) => {
    death[DeathProperties.FacingLeft] = false;
};

export const deathIsAttacking = (death: Death) => {
    return death[DeathProperties.Attacking];
};

export const deathStartFade = (death: Death) => {
    death[DeathProperties.Fading] = true;
};

export const deathStep = (death: Death, deltaTime: number) => {
    const opacityDirection = death[DeathProperties.Fading] ? -0.3 : 1;
    death[DeathProperties.Opacity] = Math.max(
        0,
        Math.min(1, death[DeathProperties.Opacity] + 0.002 * deltaTime * opacityDirection)
    );
    animatableBeginStep(death[DeathProperties.AnimatableRight]);
    animatableBeginStep(death[DeathProperties.AnimatableLeft]);

    death[DeathProperties.AttackCooldown] = Math.max(0, death[DeathProperties.AttackCooldown] - deltaTime);
    if (death[DeathProperties.Attacking]) {
        death[DeathProperties.AttackingTime] += deltaTime;
    }

    if (animationStep(death[DeathProperties.AttackAnimation], deltaTime)) {
        death[DeathProperties.AttackCooldown] = ATTACK_COOLDOWN_TIME;
    }
    animationStep(death[DeathProperties.WalkAnimation], deltaTime);

    if (!animationIsRunning(death[DeathProperties.RestAnimation])) {
        animationStart(death[DeathProperties.RestAnimation]);
    }
    animationStep(death[DeathProperties.RestAnimation], deltaTime);

    animationPause(death[DeathProperties.WalkAnimation]);

    animatableStep(
        death[death[DeathProperties.FacingLeft] ? DeathProperties.AnimatableLeft : DeathProperties.AnimatableRight]
    );
};

const ATTACK_GAP = 20;
const ATTACK_WIDTH = 1;
const getAttackLeft = (death: Death) =>
    death[DeathProperties.Position][0] +
    (death[DeathProperties.FacingLeft] ? -1 : 1) * (ATTACK_GAP + death[DeathProperties.AttackingTime] * 1.3) -
    ATTACK_WIDTH / 2;

export const deathIsHitting = (death: Death, boundingLeft: number, boundingRight: number) => {
    if (!death[DeathProperties.Attacking]) {
        return false;
    }

    const attackLeft = getAttackLeft(death);
    const attackRight = attackLeft + ATTACK_WIDTH;
    return attackLeft < boundingRight && attackRight >= boundingLeft;
};

const DEATH_WIDTH = 50;
const DEATH_HEIGHT = 100;
export const deathCollidesWithHourglass = (death: Death, hourglass: Hourglass) => {
    const [hourglassX, hourglassY] = hourglassGetPosition(hourglass);
    const [deathX, deathY] = death[DeathProperties.Position];

    return (
        hourglassX >= deathX - DEATH_WIDTH / 2 &&
        hourglassX <= deathX + DEATH_WIDTH / 2 &&
        hourglassY >= deathY &&
        hourglassY <= deathY + DEATH_HEIGHT
    );
};
