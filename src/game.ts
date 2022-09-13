import * as scytheCurvedModelData from '../art/scythe-curved.svg';
import * as scytheDoubleModelData from '../art/scythe-double.svg';
import * as scytheModelData from '../art/scythe.svg';
import { backgroundDraw, BACKGROUND_COLOR } from './background';
import {
    Death,
    deathAttack,
    deathCollidesWithHourglass,
    deathCreate,
    deathDraw,
    deathGetAttackPower,
    deathGetBoundingLeft,
    deathGetBoundingRight,
    deathGetHealth,
    deathGetPosition,
    deathGetWeaponId,
    deathHit,
    deathIncreaseHealth,
    deathIsDead,
    deathIsFacingLeft,
    deathIsHitting,
    deathRegisterHit,
    deathStep,
    deathWalk,
} from './death';
import {
    Dog,
    dogCreate,
    dogDraw,
    dogGetDeadTime,
    dogGetLeft,
    dogGetPosition,
    dogGetRight,
    dogHit,
    dogIsDead,
    dogStep,
    dogTurnLeft,
} from './dog';
import { ColorRGB, getVirtualScreenHeight, getVirtualScreenWidth, glClear, glDrawRect, Program } from './gl';
import { Vec2, vectorCreate, vectorMultiply } from './glm';
import { Hourglass, hourglassCreate, hourglassDraw, hourglassGetPosition, hourglassStep } from './hourglass';
import { keyboardInitialize } from './keyboard';
import { menuStart } from './menu';
import { modelGetWeapons, Object, objectCreate } from './model';
import { nearClaimWeapon, nearGetSignedIn } from './near';
import {
    Person,
    personCreate,
    personDraw,
    personGetDeadTime,
    personGetLeft,
    personGetPosition,
    personGetRight,
    personHit,
    personIsDead,
    personStep,
    personTurnLeft,
} from './person';
import { storageGetHighscore, storageGetWeaponIds, storageSetHighscore, storageSetWeaponIds } from './storage';
import {
    uiOpponentUpdater,
    uiPlayerHealthUpdater,
    uiScoreUpdater,
    uiToggleOpponentHealth,
    uiUpdaterCreate,
    uiUpdaterSet,
} from './ui';
import { weaponGetAttack, weaponGetDefense, weaponGetGap, weaponGetModelType, weaponGetRange } from './weapon';

export const FLOOR_LEVEL = -90;
export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 500;
export const GAME_WIDTH = 670;
export const INITIAL_TIME = 30;

const keyboard = keyboardInitialize(['Space', 'ArrowLeft', 'ArrowRight']);

export const gameIsOutOfArea = (position: Vec2) => {
    return (
        position[0] > (getVirtualScreenWidth() * 1.1) / 2 ||
        position[0] < (-getVirtualScreenWidth() * 1.1) / 2 ||
        position[1] > (getVirtualScreenHeight() * 1.1) / 2 ||
        position[1] < (-getVirtualScreenHeight() * 1.1) / 2
    );
};

export const enum GameProperties {
    Death,
    People,
    Hourglasses,
    Dogs,
    Enemy,
    Score,
    NextPerson,
    NextHourglass,
    NextDog,
    NextEnemy,
    TimePassed,
    Combo,
    Opponent,
}

export type Game = ReturnType<typeof gameCreate>;

export const enum OpponentProperties {
    WeaponType,
    Name,
}

export type Opponent = {
    [OpponentProperties.WeaponType]: number;
    [OpponentProperties.Name]: string;
};

export const gameCreate = (weaponType: number, initialHealth: number = 1) => ({
    [GameProperties.Death]: deathCreate(vectorCreate(0, FLOOR_LEVEL), weaponCreate(weaponType), initialHealth),
    [GameProperties.People]: new Set<Person>(),
    [GameProperties.Hourglasses]: new Set<Hourglass>(),
    [GameProperties.Dogs]: new Set<Dog>(),
    [GameProperties.Enemy]: null as Death,
    [GameProperties.Score]: 0,
    [GameProperties.NextPerson]: 1000,
    [GameProperties.NextHourglass]: 3000,
    [GameProperties.NextDog]: 5000,
    [GameProperties.NextEnemy]: (15 + 30 * Math.random()) * 1000,
    [GameProperties.TimePassed]: 0,
    [GameProperties.Combo]: 0,
    [GameProperties.Opponent]: null as Opponent,
});

const createHitIndicator = (position: Vec2) => createIndicator('HIT', position[0], position[1] + 50, 'hit');
const increaseTime = (game: Game, amount: number) => {
    deathIncreaseHealth(game[GameProperties.Death], amount / INITIAL_TIME);
    const deathPosition = deathGetPosition(game[GameProperties.Death]);
    const type = amount > 0 ? 'bonus' : 'penalty';
    const sign = amount > 0 ? '+' : '';
    createIndicator(`${sign}${amount}s`, deathPosition[0], deathPosition[1] + 120, type);
};

export const gamePeopleStep = (game: Game, deltaTime: number) => {
    for (const person of game[GameProperties.People]) {
        if (
            !personIsDead(person) &&
            deathIsHitting(game[GameProperties.Death], personGetLeft(person), personGetRight(person)) &&
            deathRegisterHit(game[GameProperties.Death], person)
        ) {
            createHitIndicator(personGetPosition(person));
            personHit(person, deathGetAttackPower(game[GameProperties.Death]));
            if (personIsDead(person)) {
                game[GameProperties.Combo]++;
                deathIncreaseHealth(game[GameProperties.Death], 0.4 / INITIAL_TIME);
            }
            game[GameProperties.Score] += game[GameProperties.Combo];
        }
        personStep(person, deltaTime);
        if (personGetDeadTime(person) > 2000 || gameIsOutOfArea(personGetPosition(person))) {
            game[GameProperties.People].delete(person);
        }
    }

    game[GameProperties.NextPerson] -= deltaTime;
    if (game[GameProperties.NextPerson] < 0) {
        const person = personCreate(vectorCreate((Math.random() - 0.5) * GAME_WIDTH, FLOOR_LEVEL));
        game[GameProperties.People].add(person);
        if (Math.random() < 0.5) {
            personTurnLeft(person);
        }
        game[GameProperties.NextPerson] =
            1000 + Math.random() * 300 - Math.min(900, game[GameProperties.TimePassed] * 0.006);
    }
};

const createIndicator = (text: string, x: number, y: number, type: string) => {
    const indicator = document.createElement('div');
    indicator.classList.add('indicator');
    indicator.classList.add(type);
    indicator.onanimationend = () => indicator.remove();
    indicator.innerText = text;
    Object.assign(indicator.style, {
        left: `calc(50% + ${x}px`,
        top: `calc(50% - ${y}px`,
    });
    document.querySelector('#screen').appendChild(indicator);
};

export const gameHourglasssStep = (game: Game, deltaTime: number) => {
    for (const hourglass of game[GameProperties.Hourglasses]) {
        hourglassStep(hourglass, deltaTime);

        if (deathCollidesWithHourglass(game[GameProperties.Death], hourglass) && !gameIsOver(game)) {
            game[GameProperties.Hourglasses].delete(hourglass);
            increaseTime(game, 10);
        }

        if (gameIsOutOfArea(hourglassGetPosition(hourglass))) {
            game[GameProperties.Hourglasses].delete(hourglass);
        }
    }

    game[GameProperties.NextHourglass] -= deltaTime;
    if (game[GameProperties.NextHourglass] < 0) {
        const hourglass = hourglassCreate(vectorCreate((Math.random() - 0.5) * GAME_WIDTH, VIRTUAL_HEIGHT / 2));
        game[GameProperties.Hourglasses].add(hourglass);
        game[GameProperties.NextHourglass] =
            Math.random() * 3000 + 5000 + Math.min(8000, game[GameProperties.TimePassed] * 0.1);
    }
};

export const gameDogStep = (game: Game, deltaTime: number) => {
    for (const dog of game[GameProperties.Dogs]) {
        dogStep(dog, deltaTime);
        if (
            !dogIsDead(dog) &&
            deathIsHitting(game[GameProperties.Death], dogGetLeft(dog), dogGetRight(dog)) &&
            deathRegisterHit(game[GameProperties.Death], dog)
        ) {
            createHitIndicator(dogGetPosition(dog));
            dogHit(dog, deathGetAttackPower(game[GameProperties.Death]));
            if (dogIsDead(dog)) {
                increaseTime(game, -5);
            }
        }

        if (dogGetDeadTime(dog) > 2000 || gameIsOutOfArea(dogGetPosition(dog))) {
            game[GameProperties.Dogs].delete(dog);
        }
    }

    game[GameProperties.NextDog] -= deltaTime;
    if (game[GameProperties.NextDog] < 0) {
        const dog = dogCreate(vectorCreate((Math.random() - 0.5) * GAME_WIDTH, FLOOR_LEVEL));
        if (Math.random() < 0.5) {
            dogTurnLeft(dog);
        }
        game[GameProperties.Dogs].add(dog);
        game[GameProperties.NextDog] =
            3000 + Math.random() * 1000 - Math.min(3000, game[GameProperties.TimePassed] * 0.006);
    }
};

let previousIntention = null;
let responseDelay = 0;
export const gameEnemyStep = (game: Game, deltaTime: number) => {
    const player = game[GameProperties.Death];
    const enemy = game[GameProperties.Enemy];
    if (enemy) {
        deathStep(enemy, deltaTime);

        if (!gameIsOver(game) && !deathIsDead(enemy)) {
            const playerX = deathGetPosition(player)[0];
            const playerDeltaX = playerX - deathGetPosition(enemy)[0];
            let desiredX;
            const weaponId = deathGetWeaponId(enemy);
            const desiredDistance = weaponGetGap(weaponId) + weaponGetRange(weaponId);
            if (Math.abs(playerX) > GAME_WIDTH / 2 - 100) {
                desiredX = playerX + desiredDistance * (playerX > 0 ? -1 : 1);
            } else {
                desiredX = playerX + desiredDistance * (playerDeltaX > 0 ? -1 : 1);
            }

            const deltaX = desiredX - deathGetPosition(enemy)[0];
            const facingOpposite = deathIsFacingLeft(enemy) !== playerDeltaX < 0;

            let intention = null;
            if ((Math.abs(deltaX) > 10 && facingOpposite) || Math.abs(deltaX) > 20) {
                intention = 1;
            } else if (facingOpposite) {
                intention = 2;
            }

            if (responseDelay > 0) {
                responseDelay -= deltaTime;
            } else if (previousIntention !== intention) {
                responseDelay = 150 + Math.random() * 150;
                previousIntention = intention;
            } else {
                if (intention === 1) {
                    deathWalk(enemy, deltaTime, deltaX < 0);
                } else if (intention === 2) {
                    deathWalk(enemy, deltaTime, !deathIsFacingLeft(enemy));
                }
            }

            if (!facingOpposite && Math.random() < 0.01) {
                deathAttack(enemy);
            }

            if (
                deathIsHitting(enemy, deathGetBoundingLeft(player), deathGetBoundingRight(player)) &&
                deathRegisterHit(enemy, player)
            ) {
                deathHit(player, deathGetAttackPower(enemy));
                createHitIndicator(deathGetPosition(player));
            }

            if (
                deathIsHitting(player, deathGetBoundingLeft(enemy), deathGetBoundingRight(enemy)) &&
                deathRegisterHit(player, enemy)
            ) {
                deathHit(enemy, deathGetAttackPower(player));
                createHitIndicator(deathGetPosition(enemy));
                uiUpdaterSet(uiOpponentUpdater, deathGetHealth(enemy));
                if (deathIsDead(enemy)) {
                    uiToggleOpponentHealth(false);
                    claimWeapon(deathGetWeaponId(enemy));
                }
            }
        }
    }

    game[GameProperties.NextEnemy] -= deltaTime;
    if (game[GameProperties.NextEnemy] < 0) {
        const enemy = deathCreate(
            vectorCreate(0, FLOOR_LEVEL),
            weaponCreate(game[GameProperties.Opponent][OpponentProperties.WeaponType])
        );
        if (Math.random() < 0.5) {
            deathWalk(enemy, deltaTime, true);
        }
        game[GameProperties.Enemy] = enemy;
        game[GameProperties.NextEnemy] = Infinity;
        uiToggleOpponentHealth(true, game[GameProperties.Opponent][OpponentProperties.Name]);
        uiUpdaterSet(uiOpponentUpdater, deathGetHealth(enemy));
    }
};

const claimWeapon = async (weaponId: number) => {
    const near = await nearGetSignedIn();
    if (near) {
        nearClaimWeapon(near);
    } else {
        storageSetWeaponIds([...new Set([...storageGetWeaponIds(), weaponId])]);
    }
};

export const gameStep = (game: Game, deltaTime: number) => {
    if (!gameIsOver(game)) {
        if (keyboard.ArrowLeft || keyboard.ArrowRight) {
            deathWalk(game[GameProperties.Death], deltaTime, keyboard.ArrowLeft);
        }

        if (keyboard.Space) {
            deathAttack(game[GameProperties.Death]);
        }
    }

    deathStep(game[GameProperties.Death], deltaTime);
    gamePeopleStep(game, deltaTime);
    gameHourglasssStep(game, deltaTime);
    gameDogStep(game, deltaTime);
    gameEnemyStep(game, deltaTime);
};

export const gameRender = (game: Game, program: Program) => {
    glClear(program, BACKGROUND_COLOR);

    backgroundDraw(program);
    for (const person of game[GameProperties.People]) {
        personDraw(person, program);
    }
    for (const hourglass of game[GameProperties.Hourglasses]) {
        hourglassDraw(hourglass, program);
    }
    for (const dog of game[GameProperties.Dogs]) {
        dogDraw(dog, program);
    }

    if (game[GameProperties.Enemy]) {
        deathDraw(game[GameProperties.Enemy], program);
    }
    deathDraw(game[GameProperties.Death], program);
    // renderDebuggingRects(program);
};

export const menuRender = (game: Game, program: Program) => {
    glClear(program, BACKGROUND_COLOR);

    backgroundDraw(program);
    for (const person of game[GameProperties.People]) {
        personDraw(person, program);
    }
    for (const dog of game[GameProperties.Dogs]) {
        dogDraw(dog, program);
    }
};

const virtualOrigin = vectorMultiply(vectorCreate(VIRTUAL_WIDTH, VIRTUAL_HEIGHT), -0.5);
const virtualSize = vectorCreate(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
const gameOrigin = vectorMultiply(vectorCreate(GAME_WIDTH, VIRTUAL_HEIGHT), -0.5);
const gameSize = vectorCreate(GAME_WIDTH, VIRTUAL_HEIGHT);
const renderDebuggingRects = (program: Program) => {
    glDrawRect(program, virtualOrigin, virtualSize);
    glDrawRect(program, gameOrigin, gameSize);
};

export const gameStart = (game: Game, program: Program) => {
    let comboTime = 0;
    const comboUpdater = uiUpdaterCreate((value: number) => {
        if (value === 0) {
            return;
        }

        comboTime = 1000;
        if (value === 1) {
            return;
        }

        const deathPosition = deathGetPosition(game[GameProperties.Death]);
        const text = `${value}x`;
        createIndicator(text, deathPosition[0], deathPosition[1] + 100, 'combo');
    });

    let previousTime = 0;
    const loop = (time: number) => {
        const deltaTime = time - previousTime;
        previousTime = time;

        const relativeSpeed = 0.6 + Math.min(0.3, ((game[GameProperties.TimePassed] * 0.00004) | 0) / 10);
        gameStep(game, deltaTime * relativeSpeed);
        gameRender(game, program);

        deathIncreaseHealth(game[GameProperties.Death], -(deltaTime * 0.001) / INITIAL_TIME);
        game[GameProperties.TimePassed] += deltaTime;
        uiUpdaterSet(uiPlayerHealthUpdater, deathGetHealth(game[GameProperties.Death]));
        uiUpdaterSet(uiScoreUpdater, game[GameProperties.Score]);
        uiUpdaterSet(comboUpdater, game[GameProperties.Combo]);
        comboTime -= deltaTime;
        if (comboTime <= 0) {
            game[GameProperties.Combo] = 0;
            comboTime = 0;
        }

        if (deathIsDead(game[GameProperties.Death])) {
            document.querySelectorAll('.after-game').forEach(e => e.classList.remove('hidden'));
            const score = game[GameProperties.Score];
            storageSetHighscore(Math.max(storageGetHighscore(), score));
            (document.querySelector('#last-score') as HTMLElement).innerText = score as any as string;
            menuStart(program, game);
        } else {
            requestAnimationFrame(loop);
        }
    };

    requestAnimationFrame((time: number) => loop((previousTime = time)));
};

export const gameIsOver = (game: Game) => deathIsDead(game[GameProperties.Death]);

const enum WeaponProperties {
    Object,
    Id,
}

export type Weapon = {
    [WeaponProperties.Object]: Object;
    [WeaponProperties.Id]: number;
};

const weaponColors: Array<ColorRGB> = [
    [0.4, 0.22, 0], // wood
    [0.75, 0.54, 0.44], // bronze
    [0.81, 0.82, 0.84], // steel
    [0.83, 0.69, 0.22], // gold
];

export const weaponCreate = (weaponId: number): Weapon => {
    const modelType = weaponGetModelType(weaponId);
    const model = modelGetWeapons()[modelType];
    const bladeColor = weaponColors[1 + weaponGetAttack(weaponId)];
    const snathColor = weaponColors[weaponGetDefense(weaponId)];
    const colorOverrides = [
        {
            [scytheModelData.bladeComponentId]: bladeColor,
            [scytheModelData.snathComponentId]: snathColor,
        },
        {
            [scytheCurvedModelData.bladeComponentId]: bladeColor,
            [scytheCurvedModelData.snathComponentId]: snathColor,
        },
        {
            [scytheDoubleModelData.blade1ComponentId]: bladeColor,
            [scytheDoubleModelData.blade2ComponentId]: bladeColor,
            [scytheDoubleModelData.snathComponentId]: snathColor,
        },
    ][modelType];

    return {
        [WeaponProperties.Object]: objectCreate(model, {}, colorOverrides),
        [WeaponProperties.Id]: weaponId,
    };
};

export const weaponGetObject = (weapon: Weapon) => weapon[WeaponProperties.Object];
export const weaponGetId = (weapon: Weapon) => weapon[WeaponProperties.Id];
