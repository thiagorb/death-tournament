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
        if (validateData(parsed)) {
            storageData = parsed;
        }
    } catch (e) {}

    return storageData;
};

const validateData = (parsed: any) => {
    if (typeof parsed !== 'object') {
        return false;
    }

    if (typeof parsed[StorageDataProperties.Highscore] !== 'number') {
        return false;
    }

    if (parsed[StorageDataProperties.NetworkId] !== null) {
        return typeof parsed[StorageDataProperties.NetworkId] === 'string';
    }

    return true;
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
