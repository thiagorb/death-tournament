import * as modelData from '../art/death.svg';
import * as scytheModelData from '../art/scythe.svg';
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
    animationIsRunning,
    animationPause,
    animationResume,
    animationStart,
    animationStep,
    boundElementCreate,
} from './animation';
import { GAME_WIDTH } from './game';
import { glSetGlobalOpacity, Program } from './gl';
import { matrixScale, matrixSetIdentity, matrixTranslateVector, Vec2 } from './glm';
import { Hourglass, hourglassGetPosition } from './hourglass';
import { Model, modelCreate, Object, objectCreate } from './model';

let model: Model;
let scytheModel: Model;

export const deathInit = (program: Program) => {
    model = modelCreate(program, modelData.model);
    scytheModel = modelCreate(program, scytheModelData.model);
};

const enum DeathProperties {
    Position,
    AttackCooldown,
    AnimatableRight,
    AnimatableLeft,
    AttackAnimation,
    RestAnimation,
    WalkAnimation,
    DeadAnimation,
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
    [DeathProperties.DeadAnimation]: Animation;
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
    const weapon = animationElementCreate();
    const bodyTranslate = animationElementCreate();

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
            animationFrameItemCreate(rightArm2, -0.5, 0.005),
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
        [DeathProperties.AnimatableRight]: animatableCreate(
            objectCreate(model, {
                [modelData.weaponLeftComponentId]: objectCreate(scytheModel),
                [modelData.weaponRightComponentId]: null,
            }),
            [
                boundElementCreate(leftArm1, modelData.leftArm1ComponentId),
                boundElementCreate(leftArm2, modelData.leftArm2ComponentId),
                boundElementCreate(rightArm1, modelData.rightArm1ComponentId),
                boundElementCreate(rightArm2, modelData.rightArm2ComponentId),
                boundElementCreate(weapon, modelData.weaponLeftComponentId),
                boundElementCreate(bodyTranslate, modelData.bodyComponentId, AnimatedProperty.TranslationY),
            ]
        ),
        [DeathProperties.AnimatableLeft]: animatableCreate(
            objectCreate(model, {
                [modelData.weaponLeftComponentId]: null,
                [modelData.weaponRightComponentId]: objectCreate(scytheModel),
            }),
            [
                boundElementCreate(rightArm1, modelData.leftArm1ComponentId),
                boundElementCreate(rightArm2, modelData.leftArm2ComponentId),
                boundElementCreate(leftArm1, modelData.rightArm1ComponentId),
                boundElementCreate(leftArm2, modelData.rightArm2ComponentId),
                boundElementCreate(weapon, modelData.weaponLeftComponentId),
                boundElementCreate(bodyTranslate, modelData.bodyComponentId, AnimatedProperty.TranslationY),
            ]
        ),
        [DeathProperties.AttackAnimation]: null,
        [DeathProperties.RestAnimation]: restAnimation,
        [DeathProperties.WalkAnimation]: walkAnimation,
        [DeathProperties.DeadAnimation]: null,
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

    death[DeathProperties.DeadAnimation] = animationCreate([
        animationFrameCreate(
            [
                animationFrameItemCreate(leftArm1, 0, 0.01),
                animationFrameItemCreate(leftArm2, 0, 0.01),
                animationFrameItemCreate(rightArm1, 0, 0.01),
                animationFrameItemCreate(rightArm2, 0, 0.01),
                animationFrameItemCreate(weapon, 0.6, 0.002),
                animationFrameItemCreate(bodyTranslate, 60, 0.05),
            ],
            () => animationStart(death[DeathProperties.DeadAnimation])
        ),
    ]);

    return death;
};

export const deathDraw = (death: Death, program: Program) => {
    glSetGlobalOpacity(program, death[DeathProperties.Opacity]);

    if (death[DeathProperties.FacingLeft]) {
        const matrix = animatableGetRootTransform(death[DeathProperties.AnimatableLeft]);
        matrixSetIdentity(matrix);
        matrixTranslateVector(matrix, death[DeathProperties.Position]);
        matrixScale(matrix, -1, 1);
        animatableTransform(death[DeathProperties.AnimatableLeft]);
        animatableDraw(death[DeathProperties.AnimatableLeft], program);
    } else {
        const matrix = animatableGetRootTransform(death[DeathProperties.AnimatableRight]);
        matrixSetIdentity(matrix);
        matrixTranslateVector(matrix, death[DeathProperties.Position]);
        animatableTransform(death[DeathProperties.AnimatableRight]);
        animatableDraw(death[DeathProperties.AnimatableRight], program);
    }

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
    death[DeathProperties.Position][0] = Math.max(-GAME_WIDTH / 2, Math.min(GAME_WIDTH / 2, newX));
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
    animationStart(death[DeathProperties.DeadAnimation]);
};

export const deathStep = (death: Death, deltaTime: number) => {
    const opacityDirection = death[DeathProperties.Fading] ? -0.5 : 1;
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

    animationStep(death[DeathProperties.DeadAnimation], deltaTime);
    if (animationStep(death[DeathProperties.AttackAnimation], deltaTime)) {
        death[DeathProperties.AttackCooldown] = ATTACK_COOLDOWN_TIME;
    }
    animationStep(death[DeathProperties.WalkAnimation], deltaTime);

    if (!animationIsRunning(death[DeathProperties.RestAnimation])) {
        animationStart(death[DeathProperties.RestAnimation]);
    }
    animationStep(death[DeathProperties.RestAnimation], deltaTime);

    animationPause(death[DeathProperties.WalkAnimation]);
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
const HOURGLASS_WIDTH = 30;
export const deathCollidesWithHourglass = (death: Death, hourglass: Hourglass) => {
    const [hourglassX, hourglassY] = hourglassGetPosition(hourglass);
    const [deathX, deathY] = death[DeathProperties.Position];

    return (
        hourglassX + HOURGLASS_WIDTH / 2 >= deathX - DEATH_WIDTH / 2 &&
        hourglassX - HOURGLASS_WIDTH / 2 <= deathX + DEATH_WIDTH / 2 &&
        hourglassY >= deathY &&
        hourglassY <= deathY + DEATH_HEIGHT
    );
};

export const deathGetPosition = (death: Death) => death[DeathProperties.Position];
