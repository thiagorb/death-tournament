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
