import * as modelData from '../art/death.svg';
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
    AnimationElement,
    animationElementCreate,
    animationElementGetValue,
    animationFrameCreate,
    animationFrameItemCreate,
    animationIsRunning,
    animationPause,
    animationResume,
    animationStart,
    animationStep,
    boundElementCreate,
} from './animation';
import { GAME_WIDTH, Weapon, weaponGetId, weaponGetObject } from './game';
import { glDrawRect, glSetGlobalOpacity, Program } from './gl';
import { matrixScale, matrixSetIdentity, matrixTranslateVector, Vec2, vectorAdd, vectorCreate } from './glm';
import { Hourglass, hourglassGetPosition } from './hourglass';
import { Models, models, objectCreate } from './model';
import { weaponGetAttack, weaponGetDefense, weaponGetGap, weaponGetRange } from './weapon';

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
    HitSet,
    Opacity,
    Weapon,
    Health,
    AttackingArm,
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
    [DeathProperties.HitSet]: WeakSet<object>;
    [DeathProperties.Opacity]: number;
    [DeathProperties.Weapon]: Weapon;
    [DeathProperties.Health]: number;
    [DeathProperties.AttackingArm]: AnimationElement;
};

const ATTACK_START = -3;
const ATTACK_END = -0.7;
export const deathCreate = (position: Vec2, weapon: Weapon): Death => {
    const REST_LEFT_1 = 0;
    const REST_LEFT_2 = -1.5;
    const REST_RIGHT_1 = 0;
    const REST_RIGHT_2 = -0.5;
    const leftArm1 = animationElementCreate(REST_LEFT_1);
    const leftArm2 = animationElementCreate(REST_LEFT_2);
    const rightArm1 = animationElementCreate(REST_RIGHT_1);
    const rightArm2 = animationElementCreate(REST_RIGHT_2);
    const weaponAnimationElement = animationElementCreate();
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
            objectCreate(models[Models.Death], {
                [modelData.weaponLeftComponentId]: weapon && weaponGetObject(weapon),
                [modelData.weaponRightComponentId]: null,
            }),
            [
                boundElementCreate(leftArm1, modelData.leftArm1ComponentId),
                boundElementCreate(leftArm2, modelData.leftArm2ComponentId),
                boundElementCreate(rightArm1, modelData.rightArm1ComponentId),
                boundElementCreate(rightArm2, modelData.rightArm2ComponentId),
                boundElementCreate(weaponAnimationElement, modelData.weaponLeftComponentId),
                boundElementCreate(bodyTranslate, modelData.bodyComponentId, AnimatedProperty.TranslationY),
            ]
        ),
        [DeathProperties.AnimatableLeft]: animatableCreate(
            objectCreate(models[Models.Death], {
                [modelData.weaponLeftComponentId]: null,
                [modelData.weaponRightComponentId]: weapon && weaponGetObject(weapon),
            }),
            [
                boundElementCreate(rightArm1, modelData.leftArm1ComponentId),
                boundElementCreate(rightArm2, modelData.leftArm2ComponentId),
                boundElementCreate(leftArm1, modelData.rightArm1ComponentId),
                boundElementCreate(leftArm2, modelData.rightArm2ComponentId),
                boundElementCreate(weaponAnimationElement, modelData.weaponLeftComponentId),
                boundElementCreate(bodyTranslate, modelData.bodyComponentId, AnimatedProperty.TranslationY),
            ]
        ),
        [DeathProperties.AttackAnimation]: null,
        [DeathProperties.RestAnimation]: restAnimation,
        [DeathProperties.WalkAnimation]: walkAnimation,
        [DeathProperties.DeadAnimation]: null,
        [DeathProperties.FacingLeft]: false,
        [DeathProperties.Attacking]: false,
        [DeathProperties.HitSet]: null,
        [DeathProperties.Opacity]: 0,
        [DeathProperties.Weapon]: weapon,
        [DeathProperties.Health]: 1,
        [DeathProperties.AttackingArm]: leftArm1,
    };

    const attackPrepareSpeed = 0.02;
    const attackSpeed = attackPrepareSpeed * 2;
    death[DeathProperties.AttackAnimation] = animationCreate([
        animationFrameCreate(
            [
                animationFrameItemCreate(leftArm1, ATTACK_START, attackPrepareSpeed),
                animationFrameItemCreate(leftArm2, -2, attackPrepareSpeed),
            ],
            () => {
                death[DeathProperties.Attacking] = true;
                death[DeathProperties.HitSet] = new WeakSet();
            }
        ),
        animationFrameCreate([
            animationFrameItemCreate(leftArm1, ATTACK_END, attackSpeed),
            animationFrameItemCreate(leftArm2, 0, attackSpeed),
        ]),
        animationFrameCreate(restPositionLeftArm),
    ]);

    death[DeathProperties.DeadAnimation] = animationCreate([
        animationFrameCreate(
            [
                animationFrameItemCreate(leftArm1, 0, 0.01),
                animationFrameItemCreate(leftArm2, 0, 0.01),
                animationFrameItemCreate(rightArm1, 0, 0.01),
                animationFrameItemCreate(rightArm2, 0, 0.01),
                animationFrameItemCreate(weaponAnimationElement, 0.6, 0.002),
                animationFrameItemCreate(bodyTranslate, 60, 0.05),
            ],
            () => animationStart(death[DeathProperties.DeadAnimation])
        ),
    ]);

    return death;
};

export const deathDraw = (death: Death, program: Program) => {
    glSetGlobalOpacity(program, death[DeathProperties.Opacity]);

    const animatable = death[DeathProperties.FacingLeft]
        ? death[DeathProperties.AnimatableLeft]
        : death[DeathProperties.AnimatableRight];
    const matrix = animatableGetRootTransform(animatable);
    matrixSetIdentity(matrix);
    matrixTranslateVector(matrix, death[DeathProperties.Position]);
    if (death[DeathProperties.FacingLeft]) {
        matrixScale(matrix, -1, 1);
    }
    animatableTransform(animatable);
    animatableDraw(animatable, program);

    glSetGlobalOpacity(program, 1);

    if (false && process.env.NODE_ENV !== 'production') {
        const progress = deathIsAttacking(death) ? getAttackProgress(death) : 1;
        if (death[DeathProperties.Weapon]) {
            glDrawRect(program, vectorCreate(getAttackLeft(death, progress), 0), vectorCreate(ATTACK_WIDTH, 100));
        }

        glDrawRect(
            program,
            vectorAdd(vectorCreate(-DEATH_WIDTH / 2, 0), death[DeathProperties.Position]),
            vectorCreate(DEATH_WIDTH, DEATH_HEIGHT)
        );
    }
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
    const newX = death[DeathProperties.Position][0] + moveSpeed * deltaTime * (left ? -1 : 1);
    death[DeathProperties.Position][0] = Math.max(-GAME_WIDTH / 2, Math.min(GAME_WIDTH / 2, newX));
    animationResume(death[DeathProperties.WalkAnimation]);
    death[DeathProperties.FacingLeft] = left;
};

export const deathTurnRight = (death: Death) => {
    death[DeathProperties.FacingLeft] = false;
};

export const deathIsAttacking = (death: Death) => {
    return !deathIsDead(death) && death[DeathProperties.Attacking];
};

export const deathDie = (death: Death) => {
    death[DeathProperties.Health] = 0;
    animationStart(death[DeathProperties.DeadAnimation]);
};

export const deathIsDead = (death: Death) => death[DeathProperties.Health] <= 0;

export const deathStep = (death: Death, deltaTime: number) => {
    if (deathIsAttacking(death) && getAttackProgress(death) === 1) {
        death[DeathProperties.Attacking] = false;
    }

    const opacityDirection = deathIsDead(death) ? -0.5 : 1;
    death[DeathProperties.Opacity] = Math.max(
        0,
        Math.min(1, death[DeathProperties.Opacity] + 0.002 * deltaTime * opacityDirection)
    );
    animatableBeginStep(death[DeathProperties.AnimatableRight]);
    animatableBeginStep(death[DeathProperties.AnimatableLeft]);

    death[DeathProperties.AttackCooldown] = Math.max(0, death[DeathProperties.AttackCooldown] - deltaTime);

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

const ATTACK_WIDTH = 1;
const getAttackProgress = (death: Death) => {
    const arm = death[DeathProperties.AttackingArm];

    return (animationElementGetValue(arm) - ATTACK_START) / (ATTACK_END - ATTACK_START);
};
const getAttackLeft = (death: Death, progress: number) => {
    const gap = weaponGetGap(weaponGetId(death[DeathProperties.Weapon]));
    const range = weaponGetRange(weaponGetId(death[DeathProperties.Weapon]));
    const direction = death[DeathProperties.FacingLeft] ? -1 : 1;
    const attackOrigin = death[DeathProperties.Position][0] + direction * gap;
    return attackOrigin + progress * direction * range - ATTACK_WIDTH / 2;
};

export const deathIsHitting = (death: Death, boundingLeft: number, boundingRight: number) => {
    if (!deathIsAttacking(death)) {
        return false;
    }

    const attackProgress = getAttackProgress(death);
    const attackLeft = getAttackLeft(death, attackProgress);
    const attackRight = attackLeft + ATTACK_WIDTH;
    return attackLeft < boundingRight && attackRight >= boundingLeft;
};

export const deathRegisterHit = (death: Death, target: object): boolean => {
    if (death[DeathProperties.HitSet].has(target)) {
        return false;
    }

    death[DeathProperties.HitSet].add(target);
    return true;
};

// This was measured
const DEATH_WIDTH = 50;
const DEATH_HEIGHT = 100;
const HOURGLASS_WIDTH = 30;
export const deathCollidesWithHourglass = (death: Death, hourglass: Hourglass) => {
    if (deathIsDead(death)) {
        return false;
    }

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

export const deathIsFacingLeft = (death: Death) => death[DeathProperties.FacingLeft];

const ATTACK_DURATION = 50;
export const deathGetBoundingLeft = (death: Death) => death[DeathProperties.Position][0] - DEATH_WIDTH / 2;
export const deathGetBoundingRight = (death: Death) => death[DeathProperties.Position][0] + DEATH_WIDTH / 2;

export const deathGetAttackPower = (death: Death) =>
    2 + 2 * weaponGetAttack(weaponGetId(death[DeathProperties.Weapon]));

export const deathGetDefense = (death: Death) => 15 + 2 * weaponGetDefense(weaponGetId(death[DeathProperties.Weapon]));

export const deathHit = (death: Death, power: number) => {
    death[DeathProperties.Health] -= power / deathGetDefense(death);
    if (deathIsDead(death)) {
        deathDie(death);
    }
};

export const deathGetHealth = (death: Death) => death[DeathProperties.Health];

export const deathIncreaseHealth = (death: Death, amount: number) => {
    if (deathIsDead(death)) {
        return;
    }

    death[DeathProperties.Health] += amount;
    if (deathIsDead(death)) {
        deathDie(death);
    }
};

export const deathGetWeaponId = (death: Death) => weaponGetId(death[DeathProperties.Weapon]);
