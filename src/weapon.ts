const enum WeaponTypeStatsProperty {
    Range,
    Gap,
}

const enum WeaponType {
    Basic,
    Curved,
    Double,
}

const types = {
    [WeaponType.Basic]: {
        [WeaponTypeStatsProperty.Gap]: 20,
        [WeaponTypeStatsProperty.Range]: 1.3,
    },
    [WeaponType.Curved]: {
        [WeaponTypeStatsProperty.Gap]: 0,
        [WeaponTypeStatsProperty.Range]: 1.1,
    },
    [WeaponType.Double]: {
        [WeaponTypeStatsProperty.Gap]: -5,
        [WeaponTypeStatsProperty.Range]: 1.5,
    },
};

const statsMap = (() => {
    const stats: Array<[number, number]> = [];
    for (let attack = 0; attack < 4; attack++) {
        for (let defense = 0; defense < 5; defense++) {
            stats.push([attack, defense]);
        }
    }
    stats.sort((a, b) => {
        if ((a[0] >= b[0] && a[0] >= b[1]) || (a[1] >= b[0] && a[1] >= b[1])) {
            return 1;
        }

        if ((b[0] >= a[0] && b[0] >= a[1]) || (b[1] >= a[0] && b[1] >= a[1])) {
            return -1;
        }

        return 0;
    });

    return stats;
})();

const typesCount = Object.values(types).length;

export const weaponTotalTypes = () => statsMap.length * typesCount;
export const weaponGetStatsId = (weaponId: number) => ((weaponId / 3) | 0) % statsMap.length;
export const weaponGetAttack = (weaponId: number) => statsMap[weaponGetStatsId(weaponId)][0];
export const weaponGetDefense = (weaponId: number) => statsMap[weaponGetStatsId(weaponId)][1];
export const weaponGetType = (weaponId: number) => weaponId % typesCount;
export const weaponGetRange = (weaponId: number) => types[weaponGetType(weaponId)][WeaponTypeStatsProperty.Range];
export const weaponGetGap = (weaponId: number) => types[weaponGetType(weaponId)][WeaponTypeStatsProperty.Gap];
export const weaponGetRandomId = (random: number): number => {
    const value = (random ** 1.5 * weaponTotalTypes()) | 0;
    console.log({ randomWeaponId: value });
    return value;
};
export const weaponGetModelType = (weaponId: number) => weaponId % Object.values(types).length;
