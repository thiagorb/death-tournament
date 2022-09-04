import { ColorRGB, ColorRGBA, Program } from './gl';
import {
    Model,
    modelCreate,
    ModelData,
    ModelDataProperty,
    Object,
    objectCreate,
    objectDraw,
    Polygon,
    PolygonProperty,
} from './model';
// import * as modelData from '../art/background.svg';

let background: Object;

export const BACKGROUND_COLOR: ColorRGBA = [0.1, 0, 0.3, 1];

// prettier-ignore
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

const horizonLine = -100;

export const backgroundInit = (program: Program) => {
    const polygons: Array<Polygon> = [];
    polygons.push(rectCreate(-1000, horizonLine - 1000, 2000, 1000, [0.4, 0.4, 0.4]));

    const layers = 4;
    for (let layer = 0; layer < layers; layer++) {
        let currentX = -700 + (Math.random() * 300 * (1 + layer)) / layers;
        const depth = (layer + 1) / layers;
        while (currentX < 700) {
            const width = 300 * depth + Math.random() * 50;
            const left = currentX - width / 2;
            const height = 400 - depth * 200 + Math.random() * 50;
            const color = blendColor([0.2, 0.2, 0.2], BACKGROUND_COLOR, 0.3 + 0.5 * depth);

            const y = horizonLine - 50 * depth ** 3;
            polygons.push(rectCreate(left, y, width, height, color));

            const cols = (10 + 5 * depth) | 0; // (10 + Math.random() * 5) | 0;
            const windowWidth = width / cols;
            const windows = ((0.0005 * width * height * (2 + Math.random() * 10)) / windowWidth) | 0;
            const rows = (height / windowWidth) | 0;
            for (let j = 0; j < windows; j++) {
                const windowPadding = 4 * depth;
                const xShift = windowPadding + ((Math.random() * cols) | 0) * windowWidth;
                const yShift = windowPadding + ((2 + Math.random() * (rows - 2)) | 0) * windowWidth;
                const windowColor = blendColor([1, 1, 0.5], BACKGROUND_COLOR, depth);
                polygons.push(
                    rectCreate(
                        left + xShift,
                        y + height - yShift,
                        windowWidth - 2 * windowPadding,
                        windowWidth - 2 * windowPadding,
                        windowColor
                    )
                );
            }
            currentX += width + 50 + Math.random() * 600 * depth;
        }
    }

    const data: ModelData = {
        [ModelDataProperty.Polygons]: polygons,
        [ModelDataProperty.PolygonHierarchy]: [...polygons.keys()].map(k => [k]),
    };

    background = objectCreate(modelCreate(program, data));
};

const blendColor = (c1: ColorRGB, c2: ColorRGB | ColorRGBA, blend: number) =>
    c1.map((c, i) => c * blend + c2[i] * (1 - blend)) as ColorRGB;

export const backgroundDraw = (program: Program) => {
    objectDraw(background, program);
};
