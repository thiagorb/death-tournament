const enum StorageDataProperties {
    Highscore,
    NetworkId,
}

export type StorageData = ReturnType<typeof storageLoad>;

export const storageKey = 'thiagorb_death-tournament';

const storageLoad = () => {
    let storageData = {
        [StorageDataProperties.Highscore]: 0,
        [StorageDataProperties.NetworkId]: null as string,
    };

    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey));
        if (
            typeof parsed === 'object' &&
            typeof parsed[StorageDataProperties.Highscore] === 'number' &&
            typeof parsed[StorageDataProperties.NetworkId] === 'string'
        ) {
            storageData = parsed;
        }
    } catch (e) {}

    return storageData;
};

const storageUpdate = (updater: (storageData: StorageData) => void) => {
    const storageData = storageLoad();
    updater(storageData);
    localStorage.setItem(storageKey, JSON.stringify(storageData));
};

export const storageGetHighscore = () => {
    return storageLoad()[StorageDataProperties.Highscore];
};

export const storageSetHighscore = (highscore: number) => {
    storageUpdate(s => (s[StorageDataProperties.Highscore] = highscore));
};

export const storageGetNetworkId = () => {
    return storageLoad()[StorageDataProperties.NetworkId];
};

export const storageSetNetworkId = (networkId: string) => {
    storageUpdate(s => (s[StorageDataProperties.NetworkId] = networkId));
};
