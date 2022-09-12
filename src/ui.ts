const enum UpdaterProperties {
    LastUpdatedValue,
    UpdateFunction,
}

type Updater = {
    [UpdaterProperties.LastUpdatedValue]: number;
    [UpdaterProperties.UpdateFunction]: (n: number) => void;
};

export const uiUpdaterCreate = (updateFunction: Updater[UpdaterProperties.UpdateFunction]): Updater => ({
    [UpdaterProperties.LastUpdatedValue]: 0,
    [UpdaterProperties.UpdateFunction]: updateFunction,
});

export const uiUpdaterSet = (updater: Updater, displayValue: number) => {
    if (displayValue !== updater[UpdaterProperties.LastUpdatedValue]) {
        updater[UpdaterProperties.LastUpdatedValue] = displayValue;
        updater[UpdaterProperties.UpdateFunction](displayValue);
    }
};

const scoreDiv: HTMLDivElement = document.querySelector('#score');
const playerHealth = document.querySelector('#player-health') as HTMLElement;
const playerName = document.querySelector('#player-name') as HTMLElement;
const opponentHealth = document.querySelector('#opponent-health') as HTMLElement;
const opponentName = document.querySelector('#opponent-name') as HTMLElement;

export const uiSetPlayerName = (name: string) => (playerName.innerText = name);

export const uiToggleOpponentHealth = (value: boolean, name: string = null) => {
    opponentHealth.classList.toggle('hidden', !value);
    opponentName.classList.toggle('hidden', !value);
    if (name) {
        opponentName.innerText = name;
    }
};

export const uiScoreUpdater = uiUpdaterCreate((n: number) => scoreDiv.style.setProperty('--score', `'${n}`));
export const uiPlayerHealthUpdater = uiUpdaterCreate((n: number) => updateHealth(playerHealth, n));
export const uiOpponentUpdater = uiUpdaterCreate((n: number) => updateHealth(opponentHealth, n));

const updateHealth = (healthBar: HTMLElement, n: number) =>
    healthBar.style.setProperty('--progress', Math.max(0, Math.min(1, n)) as any as string);
