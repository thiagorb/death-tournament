import { ColorRGB } from './gl';
import * as scytheCurvedModelData from '../art/scythe-curved.svg';
import * as scytheDoubleModelData from '../art/scythe-double.svg';
import * as scytheModelData from '../art/scythe.svg';
import { Models, models, objectCreate } from './model';

export const colors: Array<ColorRGB> = [
    [0.4, 0.22, 0], // wood
    [0.75, 0.54, 0.44], // bronze
    [0.81, 0.82, 0.84], // steel
    [0.83, 0.69, 0.22], // gold
    [1, 0, 0], // red
];

export const weaponGetModels = () => [models[Models.Scythe], models[Models.ScytheCurved], models[Models.ScytheDouble]];

const colorMap = (() => {
    const colors: Array<[number, number]> = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
            colors.push([i, j]);
        }
    }
    colors.sort((a, b) => {
        if ((a[0] >= b[0] && a[0] >= b[1]) || (a[1] >= b[0] && a[1] >= b[1])) {
            return 1;
        }

        if ((b[0] >= a[0] && b[0] >= a[1]) || (b[1] >= a[0] && b[1] >= a[1])) {
            return -1;
        }

        return 0;
    });

    return colors;
})();

export const weaponTotalTypes = () => colorMap.length * weaponGetModels().length;

export const weaponCreate = (type: number) => {
    const modelType = type % weaponGetModels().length;

    const colorsId = (type / weaponGetModels().length) | 0;

    const [bladeColorId, snathColorId] = colorMap[colorsId];
    const bladeColor = colors[1 + bladeColorId];
    const snathColor = colors[snathColorId];
    const model = weaponGetModels()[modelType];
    const colorOverrides = [
        {
            [scytheModelData.bladeComponentId]: bladeColor,
            [scytheModelData.snathComponentId]: snathColor,
        },
        {
            [scytheCurvedModelData.bladeComponentId]: bladeColor,
            [scytheCurvedModelData.snathComponentId]: snathColor,
        },
        {
            [scytheDoubleModelData.blade1ComponentId]: bladeColor,
            [scytheDoubleModelData.blade2ComponentId]: bladeColor,
            [scytheDoubleModelData.snathComponentId]: snathColor,
        },
    ][modelType];
    return objectCreate(model, {}, colorOverrides);
};
