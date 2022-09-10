import { FLOOR_LEVEL } from './game';
import { ColorRGB, ColorRGBA, Program } from './gl';
import {
    modelCreate,
    ModelData,
    ModelDataProperty,
    Object,
    objectCreate,
    objectDraw,
    Polygon,
    PolygonProperty,
} from './model';

let background: Object;

export const BACKGROUND_COLOR: ColorRGBA = [0.1, 0, 0.3, 1];

const rectCreate = (x: number, y: number, width: number, height: number, color: ColorRGB): Polygon => ({
    // prettier-ignore
    [PolygonProperty.Vertices]: [
        x, y, 
        x + width, y, 
        x + width, y + height, 
        x, y + height
    ],
    [PolygonProperty.Indices]: [0, 2, 1, 0, 3, 2],
    [PolygonProperty.Color]: color,
    [PolygonProperty.TransformOrigin]: [0, 0],
});

const horizonLine = FLOOR_LEVEL + 80;

export const backgroundInit = (program: Program) => {
    const polygons: Array<Polygon> = [];
    polygons.push(rectCreate(-1000, horizonLine - 1000, 2000, 1000, [0.1, 0.0, 0.1]));

    const layers = 4;
    for (let layer = 0; layer < layers; layer++) {
        const buildingVertices = [];
        const windowsVertices = [];
        const buildingIndices = [];
        const windowsIndices = [];
        let currentX = -700 + (Math.random() * 300 * (1 + layer)) / layers;
        const depth = (layer + 1) / layers;
        while (currentX < 700) {
            const width = 300 * depth + Math.random() * 50;
            const x = currentX - width / 2;
            const height = 400 - depth * 200 + Math.random() * 50;

            const y = horizonLine - 20 - 40 * depth ** 3;
            const nextBuildingIndex = (buildingVertices.length / 2) | 0;
            buildingIndices.push(
                nextBuildingIndex,
                nextBuildingIndex + 2,
                nextBuildingIndex + 1,
                nextBuildingIndex,
                nextBuildingIndex + 3,
                nextBuildingIndex + 2
            );
            buildingVertices.push(x, y, x + width, y, x + width, y + height, x, y + height);

            const cols = (10 + 5 * depth) | 0;
            const windowWidth = width / cols;
            const windows = ((0.0005 * width * height * (2 + Math.random() * 10)) / windowWidth) | 0;
            const rows = (height / windowWidth) | 0;
            for (let j = 0; j < windows; j++) {
                const windowPadding = 4 * depth;
                const xShift = windowPadding + ((Math.random() * cols) | 0) * windowWidth;
                const yShift = windowPadding + ((2 + Math.random() * (rows - 2)) | 0) * windowWidth;
                const nextWindowIndex = (windowsVertices.length / 2) | 0;
                windowsIndices.push(
                    nextWindowIndex,
                    nextWindowIndex + 2,
                    nextWindowIndex + 1,
                    nextWindowIndex,
                    nextWindowIndex + 3,
                    nextWindowIndex + 2
                );
                const windowX = x + xShift;
                const windowY = y + height - yShift;
                const windowRight = windowX + windowWidth - 2 * windowPadding;
                const windowTop = windowY + windowWidth - 2 * windowPadding;
                windowsVertices.push(
                    windowX,
                    windowY,
                    windowRight,
                    windowY,
                    windowRight,
                    windowTop,
                    windowX,
                    windowTop
                );
            }
            currentX += width + 50 + Math.random() * 600 * depth;

            polygons.push({
                [PolygonProperty.Vertices]: buildingVertices,
                [PolygonProperty.Indices]: buildingIndices,
                [PolygonProperty.Color]: blendColor([0.2, 0.2, 0.2], BACKGROUND_COLOR, 0.3 + 0.5 * depth),
                [PolygonProperty.TransformOrigin]: [0, 0],
            });

            polygons.push({
                [PolygonProperty.Vertices]: windowsVertices,
                [PolygonProperty.Indices]: windowsIndices,
                [PolygonProperty.Color]: blendColor([1, 1, 0.5], BACKGROUND_COLOR, depth),
                [PolygonProperty.TransformOrigin]: [0, 0],
            });
        }
    }

    const data: ModelData = {
        [ModelDataProperty.Polygons]: polygons,
        [ModelDataProperty.ParentMap]: [],
    };

    background = objectCreate(modelCreate(program, data));
};

const blendColor = (c1: ColorRGB, c2: ColorRGB | ColorRGBA, blend: number) =>
    c1.map((c, i) => c * blend + c2[i] * (1 - blend)) as ColorRGB;

export const backgroundDraw = (program: Program) => {
    objectDraw(background, program);
};
