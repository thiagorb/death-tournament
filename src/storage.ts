const enum StorageDataProperties {
    Highscore,
    NetworkId,
    WeaponIds,
}

export type StorageData = ReturnType<typeof storageLoad>;

export const storageKey = 'thiagorb_death-tournament';

const storageLoad = () => {
    let storageData = {
        [StorageDataProperties.Highscore]: 0,
        [StorageDataProperties.NetworkId]: null as string,
        [StorageDataProperties.WeaponIds]: [] as Array<number>,
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
    if (process.env.NODE_ENV === 'production') {
        return true;
    }

    if (typeof parsed !== 'object') {
        return false;
    }

    if (typeof parsed[StorageDataProperties.Highscore] !== 'number') {
        return false;
    }

    if (
        !Array.isArray(parsed[StorageDataProperties.WeaponIds]) ||
        parsed[StorageDataProperties.WeaponIds].some(weaponId => typeof weaponId !== 'number')
    ) {
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

export const storageGetWeaponIds = () => {
    return storageLoad()[StorageDataProperties.WeaponIds];
};

export const storageSetWeaponIds = (weaponIds: Array<number>) => {
    storageUpdate(s => (s[StorageDataProperties.WeaponIds] = weaponIds));
};
