import { deathCreate } from './death';
import {
    Game,
    gameCreate,
    gameCreateWeaponByType,
    GameProperties,
    gameRender,
    gameStart,
    gameStep,
    VIRTUAL_WIDTH,
} from './game';
import { glSetGlobalOpacity, Program } from './gl';
import { matrixRotate, matrixScale, matrixSetIdentity, matrixTranslate, vectorCreate } from './glm';
import { Object, objectApplyTransforms, objectDraw, objectGetRootTransform } from './model';
import {
    nearGetAccountId,
    nearGetNeworkId,
    nearGetOpponent,
    nearGetPlayerWeapons,
    nearGetSignedIn,
    NearInstance,
    nearRequestSignIn,
    nearSignOut,
} from './near';
import { storageGetHighscore } from './storage';
import { toggleOpponentHealth } from './ui';

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
    let opponentPromise: ReturnType<typeof nearGetOpponent> = null;
    let playerWeapons: Array<Object> = [];
    let playerWeaponsType: Array<number> = [];
    let selectedWeapon = 0;
    let smoothSelectedWeapon = -1000;

    const loop = (time: number) => {
        const deltaTime = (time - previousTime) * speedMultiplier;
        previousTime = time;
        menuScene[GameProperties.TimePassed] += deltaTime;

        if (startingGame) {
            if (canStart(menuScene)) {
                opponentPromise
                    .catch(e => {
                        console.error(e);
                        return null;
                    })
                    .then(opponent => {
                        document.querySelectorAll('.game-ui').forEach(e => e.classList.remove('hidden'));
                        const game = gameCreate(
                            selectedWeapon < playerWeapons.length ? playerWeaponsType[selectedWeapon] : 0
                        );
                        game[GameProperties.Opponent] = opponent || {
                            weaponType: (Math.random() * 75) | 0,
                            playerId: null,
                        };
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
        if (Math.abs(delta) > speed || startingGame) {
            smoothSelectedWeapon += speed * (startingGame || delta > 0 ? 1 : -1);
        } else {
            smoothSelectedWeapon = selectedWeapon;
        }

        for (let i = -2; i < 3; i++) {
            const index = selectedWeapon + i;
            if (index < 0 || index >= playerWeapons.length) {
                continue;
            }

            const weapon = playerWeapons[index];
            const matrix = objectGetRootTransform(weapon);
            const shift = delta + i;
            const distance = 1 - Math.abs(shift / 3);
            matrixSetIdentity(matrix);
            matrixTranslate(matrix, VIRTUAL_WIDTH / 2 - 100, shift * 60);
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
        if (near) {
            const accountId = document.querySelector('#account-id') as HTMLElement;
            accountId.innerText = `logged as ${nearGetAccountId(near)} (${nearGetNeworkId(near)})`;
            playerWeaponsType = [...new Set(await nearGetPlayerWeapons(near))];
            playerWeaponsType.sort((a, b) => a - b).reverse();
            playerWeapons = playerWeaponsType.map(type => gameCreateWeaponByType(type));
        }
    };

    for (let i = 0; i < 60; i++) {
        gameCreateWeaponByType(i);
    }

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
        selectedWeapon = Math.max(0, Math.min(playerWeapons.length - 1, selectedWeapon + increment));
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
            toggleOpponentHealth(false);
            startButton.addEventListener('click', startGame);
            document.body.addEventListener('keypress', startGame);
            signInButton.addEventListener('click', handleSignIn);
            networkIdButton.addEventListener('click', handleNetworkId);
            signOutButton.addEventListener('click', signOut);
            document.body.addEventListener('click', toggleWeapon);

            document.querySelectorAll('.game-ui').forEach(e => e.classList.add('hidden'));
            (document.querySelector('#menu-ui') as HTMLElement).classList.remove('hidden');
            smoothSelectedWeapon = -3;
        },
        lastGame ? 3000 : 0
    );
};

const canStart = (menuScene: Game) => {
    return (
        menuScene[GameProperties.People].size === 0 &&
        menuScene[GameProperties.Dogs].size === 0 &&
        menuScene[GameProperties.Hourglasses].size === 0
    );
};
