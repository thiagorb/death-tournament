import { deathCreate } from './death';
import {
    Game,
    gameCreate,
    GameProperties,
    gameRender,
    gameStart,
    gameStep,
    Opponent,
    OpponentProperties,
    weaponCreate,
    weaponGetObject,
} from './game';
import { getVirtualScreenWidth, glSetGlobalOpacity, Program } from './gl';
import { matrixRotate, matrixScale, matrixSetIdentity, matrixTranslate, vectorCreate } from './glm';
import { Object, objectApplyTransforms, objectDraw, objectGetRootTransform } from './model';
import { monetizationIsEnabled } from './monetization';
import {
    nearGetAccountId,
    nearGetNeworkId,
    nearGetOpponent,
    nearGetPlayerWeapons,
    nearGetSignedIn,
    NearInstance,
    NearOpponent,
    nearRequestSignIn,
    nearSignOut,
} from './near';
import { storageGetHighscore, storageGetWeaponIds } from './storage';
import { uiSetPlayerName, uiToggleOpponentHealth } from './ui';
import { weaponGetRandomId } from './weapon';

let selectedWeapon = 0;
let smoothSelectedWeapon: number;
export const menuStart = (program: Program, lastGame: Game = null) => {
    (document.querySelector('#high-score') as HTMLElement).innerText = storageGetHighscore() as any as string;

    const menuScene: Game =
        lastGame ||
        Object.assign(gameCreate(0), {
            [GameProperties.Death]: deathCreate(vectorCreate(0, -10000), null),
            [GameProperties.NextEnemy]: Infinity,
        });
    let startingGame = false;
    let previousTime = 0;
    let speedMultiplier = 0.5;
    let opponentPromise: Promise<NearOpponent> = null;
    let playerWeapons: Array<Object> = [];
    let playerWeaponsType: Array<number> = [];
    let monetizationEnabled = false;
    monetizationIsEnabled.then(enabled => {
        monetizationEnabled = enabled;
        updatePlayerWeapons(playerWeaponsType);
    });

    const initialWeapons = () => (monetizationEnabled ? [0, 1, 12] : [0, 1]);

    const incrementSelectedWeapon = (increment: number) => {
        selectedWeapon = Math.max(0, Math.min(playerWeapons.length - 1, selectedWeapon + increment));
    };

    const updatePlayerWeapons = (newWeaponsType: Array<number>) => {
        playerWeaponsType = [...new Set([...initialWeapons(), ...newWeaponsType])];
        playerWeaponsType.sort((a, b) => a - b).reverse();
        playerWeapons = playerWeaponsType.map(weaponCreate).map(weaponGetObject);
        incrementSelectedWeapon(0);
    };

    const loop = (time: number) => {
        const deltaTime = (time - previousTime) * speedMultiplier;
        previousTime = time;
        menuScene[GameProperties.TimePassed] += deltaTime;

        if (startingGame) {
            if (canStart(menuScene)) {
                opponentPromise
                    .catch(e => {
                        if (process.env.NODE_ENV !== 'production') {
                            console.error(e);
                        }
                        return null;
                    })
                    .then((opponent: NearOpponent) => {
                        document.querySelectorAll('.game-ui').forEach(e => e.classList.remove('hidden'));
                        const game = gameCreate(playerWeaponsType[selectedWeapon]);

                        game[GameProperties.Opponent] = opponentFromNearOpponent(opponent);
                        gameStart(game, program);
                    });

                return;
            }

            speedMultiplier = speedMultiplier + 0.001 * deltaTime;
        }

        gameStep(menuScene, deltaTime);
        gameRender(menuScene, program);
        renderWeapons(deltaTime);

        requestAnimationFrame(loop);
    };

    const renderWeapons = (deltaTime: number) => {
        const delta = selectedWeapon - smoothSelectedWeapon;
        const speed = 0.01 * deltaTime;
        const dir = startingGame || delta > 0 ? 1 : -1;
        if (Math.abs(delta) > speed || startingGame) {
            smoothSelectedWeapon += speed * dir;
        } else {
            smoothSelectedWeapon = selectedWeapon;
        }

        for (let i = -2; i < 3; i++) {
            const index = dir > 0 ? Math.ceil(smoothSelectedWeapon + i) : Math.floor(smoothSelectedWeapon + i);
            if (index < 0 || index >= playerWeapons.length) {
                continue;
            }

            const weapon = playerWeapons[index];
            const matrix = objectGetRootTransform(weapon);
            const shift = index - smoothSelectedWeapon;
            const distance = 1 - Math.abs(shift / 3);
            matrixSetIdentity(matrix);
            matrixTranslate(matrix, getVirtualScreenWidth() / 2 - 150, shift * 60);
            matrixScale(matrix, Math.max(0, distance), Math.max(0, distance));
            matrixTranslate(matrix, 0, shift * 60);
            matrixRotate(matrix, menuScene[GameProperties.TimePassed] * 0.001);
            objectApplyTransforms(weapon);
            glSetGlobalOpacity(program, Math.max(0, distance) ** 2);
            objectDraw(weapon, program);
            glSetGlobalOpacity(program, 1);
        }
    };

    requestAnimationFrame((time: number) => loop((previousTime = time)));

    const startButton = document.querySelector('#start-game');
    const signInButton = document.querySelector('#sign-in') as HTMLElement;
    const networkIdButton = document.querySelector('#network-id') as HTMLElement;
    const signOutButton = document.querySelector('#sign-out') as HTMLElement;
    const accountId = document.querySelector('#account-id') as HTMLElement;

    const toggleElement = (element: HTMLElement, show: boolean) => {
        element.style.display = show ? null : 'none';
    };

    const toggleSignIn = async (near: NearInstance) => {
        toggleElement(signInButton, near === null);
        toggleElement(signOutButton, near !== null);
        toggleElement(accountId, near !== null);
        uiSetPlayerName(near !== null ? formatPlayerName(nearGetAccountId(near)) : 'HEALTH');
        if (near) {
            const accountId = document.querySelector('#account-id') as HTMLElement;
            accountId.innerText = `logged as ${nearGetAccountId(near)} (${nearGetNeworkId(near)})`;
            updatePlayerWeapons(await nearGetPlayerWeapons(near));
        } else {
            updatePlayerWeapons(storageGetWeaponIds());
        }
    };

    nearGetSignedIn().then(toggleSignIn);

    const startGame = () => {
        opponentPromise = nearGetSignedIn().then(async near => (near ? nearGetOpponent(near) : null));
        startingGame = true;
        menuScene[GameProperties.NextPerson] = Infinity;
        menuScene[GameProperties.NextDog] = Infinity;
        menuScene[GameProperties.NextHourglass] = Infinity;
        (document.querySelector('#menu-ui') as HTMLElement).classList.add('hidden');
        startButton.removeEventListener('click', startGame);
        signInButton.removeEventListener('click', handleSignIn);
        networkIdButton.removeEventListener('click', handleNetworkId);
        signOutButton.removeEventListener('click', signOut);
        document.body.removeEventListener('keypress', startGame);
        document.body.removeEventListener('click', toggleWeapon);
    };

    const toggleWeapon = (e: MouseEvent) => {
        if ((e.target as HTMLElement).id !== 'menu-ui') {
            return;
        }

        const increment = e.clientY > document.body.offsetHeight / 2 ? -1 : 1;
        incrementSelectedWeapon(increment);
    };

    const handleSignIn = () => {
        signInButton.style.display = 'none';
        networkIdButton.style.display = null;
    };

    const handleNetworkId = (event: MouseEvent) => {
        const networkId = (event.target as HTMLElement).getAttribute('data-network-id');
        if (networkId) {
            nearRequestSignIn(networkId);
        }
    };

    const signOut = async () => {
        await nearSignOut();
        toggleSignIn(null);
    };

    setTimeout(
        () => {
            uiToggleOpponentHealth(false);
            startButton.addEventListener('click', startGame);
            document.body.addEventListener('keypress', startGame);
            signInButton.addEventListener('click', handleSignIn);
            networkIdButton.addEventListener('click', handleNetworkId);
            signOutButton.addEventListener('click', signOut);
            document.body.addEventListener('click', toggleWeapon);

            document.querySelectorAll('.game-ui').forEach(e => e.classList.add('hidden'));
            (document.querySelector('#menu-ui') as HTMLElement).classList.remove('hidden');
        },
        lastGame ? 3000 : 0
    );
    smoothSelectedWeapon = lastGame ? -17 : -3;
};

const canStart = (menuScene: Game) => {
    return (
        menuScene[GameProperties.People].size === 0 &&
        menuScene[GameProperties.Dogs].size === 0 &&
        menuScene[GameProperties.Hourglasses].size === 0
    );
};

const formatPlayerName = (name: string) => {
    const parts = name.split('.');
    if (parts.length > 1) {
        parts.pop();
    }
    return parts.join('.');
};

const opponentFromNearOpponent = (opponent: NearOpponent): Opponent => ({
    [OpponentProperties.WeaponType]: opponent?.weaponType || weaponGetRandomId(Math.random()),
    [OpponentProperties.Name]: formatPlayerName(opponent?.playerId || 'ENEMY'),
});
