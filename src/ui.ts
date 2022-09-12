const enum UpdaterProperties {
    LastUpdatedValue,
    UpdateFunction,
}

type Updater = {
    [UpdaterProperties.LastUpdatedValue]: number;
    [UpdaterProperties.UpdateFunction]: (n: number) => void;
};

export const updaterCreate = (updateFunction: Updater[UpdaterProperties.UpdateFunction]): Updater => ({
    [UpdaterProperties.LastUpdatedValue]: 0,
    [UpdaterProperties.UpdateFunction]: updateFunction,
});

export const updaterSet = (updater: Updater, displayValue: number) => {
    if (displayValue !== updater[UpdaterProperties.LastUpdatedValue]) {
        updater[UpdaterProperties.LastUpdatedValue] = displayValue;
        updater[UpdaterProperties.UpdateFunction](displayValue);
    }
};

export const timerDiv: HTMLDivElement = document.querySelector('#timer');
export const scoreDiv: HTMLDivElement = document.querySelector('#score');
export const opponentHealth = document.querySelector('#opponent-health') as HTMLElement;
export const opponentName = document.querySelector('#opponent-name') as HTMLElement;

export const toggleOpponentHealth = (value: boolean, name: string = null) => {
    opponentHealth.classList.toggle('hidden', !value);
    opponentName.classList.toggle('hidden', !value);
    if (name) {
        opponentName.innerText = name;
    }
};

export const scoreUpdater = updaterCreate((n: number) => scoreDiv.style.setProperty('--score', `'${n}`));
export const timerUpdater = updaterCreate((n: number) => timerDiv.style.setProperty('--progress', n as any as string));
export const opponentUpdater = updaterCreate((n: number) =>
    opponentHealth.style.setProperty('--progress', n as any as string)
);
