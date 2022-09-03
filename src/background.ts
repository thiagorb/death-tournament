import { ColorRGB, Program } from './gl';
import { Model, modelCreate, ModelData, ModelDataProperty, Object, objectCreate, objectDraw, Polygon, PolygonProperty } from './model';
// import * as modelData from '../art/background.svg';

let background: Object;

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

export const backgroundInit = (program: Program) => {
    const polygons: Array<Polygon> = [];

    const layers = 6;
    for (let l = 0; l < layers; l++) {
        let currentX = -700 + Math.random() * 300;
        while (currentX < 700) {
            const width = 200 + Math.random() * 100;
            const left = currentX - width / 2;
            const height = 100 + Math.random() * 200;
            const shade = (l / (layers - 1)) * 0.1;

            polygons.push(rectCreate(left, 0, width, height, [shade, shade, shade]));

            const windows = (2 + Math.random() * 10) | 0;
            const cols = 10; // (10 + Math.random() * 5) | 0;
            const windowWidth = width / cols;
            const rows = (height / windowWidth) | 0;
            for (let j = 0; j < windows; j++) {
                const xShift = 2 + ((Math.random() * cols) | 0) * windowWidth;
                const yShift = 2 + ((2 + Math.random() * (rows - 2)) | 0) * windowWidth;
                polygons.push(rectCreate(left + xShift, yShift, windowWidth - 4, windowWidth - 4, [1, 1, 0]));
            }
            currentX += width + 50 + Math.random() * 50;
        }
    }

    polygons.push(rectCreate(-1000, -1000, 2000, 1000, [0.4, 0.4, 0.4]));
    const data: ModelData = {
        [ModelDataProperty.Polygons]: polygons,
        [ModelDataProperty.PolygonHierarchy]: [...polygons.keys()].map(k => [k]),
    };

    background = objectCreate(modelCreate(program, data));
};

export const backgroundDraw = (program: Program) => {
    objectDraw(background, program);
};
