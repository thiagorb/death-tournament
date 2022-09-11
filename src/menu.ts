import { deathCreate } from './death';
import { Game, gameCreate, GameProperties, gameRender, gameStart, gameStep } from './game';
import { Program } from './gl';
import { vectorCreate } from './glm';
import {
    nearGetAccountId,
    nearGetNeworkId,
    nearGetSignedIn,
    NearInstance,
    nearRequestSignIn,
    nearSignOut,
} from './near';
import { storageGetHighscore } from './storage';

export const menuStart = (program: Program, lastGame: Game = null) => {
    (document.querySelector('#high-score') as HTMLElement).innerText = storageGetHighscore() as any as string;

    const menuScene: Game =
        lastGame ||
        Object.assign(gameCreate(), {
            [GameProperties.Death]: deathCreate(vectorCreate(0, -10000), null),
            [GameProperties.NextEnemy]: Infinity,
        });
    let startingGame = false;
    let previousTime = 0;
    let speedMultiplier = 0.5;
    const loop = (time: number) => {
        const deltaTime = (time - previousTime) * speedMultiplier;
        previousTime = time;

        if (startingGame) {
            if (canStart(menuScene)) {
                document.querySelectorAll('.game-ui').forEach(e => e.classList.remove('hidden'));
                const game = gameCreate();
                gameStart(game, program);
                return;
            }

            speedMultiplier = speedMultiplier + 0.001 * deltaTime;
        }

        gameStep(menuScene, deltaTime);
        gameRender(menuScene, program);

        requestAnimationFrame(loop);
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

    const toggleSignIn = (near: NearInstance) => {
        toggleElement(signInButton, near === null);
        toggleElement(signOutButton, near !== null);
        toggleElement(accountId, near !== null);
        if (near) {
            const accountId = document.querySelector('#account-id') as HTMLElement;
            accountId.innerText = `logged as ${nearGetAccountId(near)} (${nearGetNeworkId(near)})`;
        }
    };

    nearGetSignedIn().then(toggleSignIn);

    const startGame = () => {
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
            startButton.addEventListener('click', startGame);
            document.body.addEventListener('keypress', startGame);
            signInButton.addEventListener('click', handleSignIn);
            networkIdButton.addEventListener('click', handleNetworkId);
            signOutButton.addEventListener('click', signOut);

            document.querySelectorAll('.game-ui').forEach(e => e.classList.add('hidden'));
            (document.querySelector('#menu-ui') as HTMLElement).classList.remove('hidden');
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
