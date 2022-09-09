const enum StorageDataProperties {
    Highscore,
}

export type StorageData = ReturnType<typeof storageLoad>;

const storageKey = 'thiagorb_death';

const storageLoad = () => {
    let storageData = {
        [StorageDataProperties.Highscore]: 0,
    };

    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey));
        if (typeof parsed === 'object' && typeof parsed[StorageDataProperties.Highscore] === 'number') {
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
