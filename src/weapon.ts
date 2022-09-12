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
        [WeaponTypeStatsProperty.Range]: 78,
    },
    [WeaponType.Curved]: {
        [WeaponTypeStatsProperty.Gap]: 0,
        [WeaponTypeStatsProperty.Range]: 66,
    },
    [WeaponType.Double]: {
        [WeaponTypeStatsProperty.Gap]: -5,
        [WeaponTypeStatsProperty.Range]: 90,
    },
};

const statsMap = (() => {
    const stats: Array<[number, number]> = [];
    for (let attack = 0; attack < 4; attack++) {
        for (let defense = 0; defense < 5; defense++) {
            stats.push([attack, defense]);
        }
    }
    stats.sort(([attackA, defenseA], [attackB, defenseB]) => {
        const allValues = [attackA, defenseA, attackB, defenseB];
        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        if (min === max) {
            return 0;
        }

        if ((attackA === max) !== (attackB === max)) {
            return attackA === max ? 1 : -1;
        }

        if ((defenseA === max) !== (defenseB === max)) {
            return defenseA === max ? 1 : -1;
        }

        if (attackA === max) {
            return defenseA - defenseB;
        }

        return attackA - attackB;
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
export const weaponGetRandomId = (random: number): number => (random ** 1.5 * weaponTotalTypes()) | 0;
export const weaponGetModelType = (weaponId: number) => weaponId % Object.values(types).length;
