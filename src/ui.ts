const enum TimerProperties {
    RemainingTime,
    Updater,
}

type Timer = {
    [TimerProperties.RemainingTime]: number;
    [TimerProperties.Updater]: Updater;
};

export const timerCreate = (updateFunction: Updater[UpdaterProperties.UpdateFunction]): Timer => ({
    [TimerProperties.RemainingTime]: 60000,
    [TimerProperties.Updater]: updaterCreate(updateFunction),
});

export const timerStep = (timer: Timer, deltaTime: number) => {
    timer[TimerProperties.RemainingTime] = Math.max(0, timer[TimerProperties.RemainingTime] - deltaTime);

    updaterSet(timer[TimerProperties.Updater], Math.floor(timer[TimerProperties.RemainingTime] / 1000));
};

export const timerIncrease = (timer: Timer, deltaTime: number) => {
    timer[TimerProperties.RemainingTime] += deltaTime;
};

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
