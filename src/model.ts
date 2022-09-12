import { ColorRGB, glMeshDraw, glMeshCreate, Mesh, Program, glSetModelTransform } from './gl';
import { Matrix3, matrixCopy, matrixCreate, matrixTranslateVector, Vec2, vectorCreate } from './glm';
import * as deathModelData from '../art/death.svg';
import * as scytheModelData from '../art/scythe.svg';
import * as scytheCurvedModelData from '../art/scythe-curved.svg';
import * as scytheDoubleModelData from '../art/scythe-double.svg';
import * as dogModelData from '../art/dog.svg';
import * as personModelData from '../art/person.svg';
import * as hourglassModelData from '../art/hourglass.svg';

export const enum Models {
    Death,
    Scythe,
    ScytheCurved,
    ScytheDouble,
    Dog,
    Person,
    Hourglass,
}

export let models: ReturnType<typeof modelsInit>;
export const modelsInit = (program: Program) => {
    const m = {
        [Models.Death]: modelCreate(program, deathModelData.model),
        [Models.Scythe]: modelCreate(program, scytheModelData.model),
        [Models.ScytheCurved]: modelCreate(program, scytheCurvedModelData.model),
        [Models.ScytheDouble]: modelCreate(program, scytheDoubleModelData.model),
        [Models.Dog]: modelCreate(program, dogModelData.model),
        [Models.Person]: modelCreate(program, personModelData.model),
        [Models.Hourglass]: modelCreate(program, hourglassModelData.model),
    };
    models = m;
    return m;
};

export const enum PolygonProperty {
    Vertices,
    Indices,
    Color,
    TransformOrigin,
}

export type Polygon = {
    [PolygonProperty.Vertices]: Array<number>;
    [PolygonProperty.Indices]: Array<number>;
    [PolygonProperty.Color]: ColorRGB;
    [PolygonProperty.TransformOrigin]: [number, number];
};

export const enum ModelDataProperty {
    Polygons,
    ParentMap,
}

export type ModelData = {
    [ModelDataProperty.Polygons]: Array<Polygon>;
    [ModelDataProperty.ParentMap]: Array<number>;
};

const enum ModelMeshProperty {
    Mesh,
    TransformOrigin,
}

export type ModelMesh = {
    [ModelMeshProperty.Mesh]: Mesh;
    [ModelMeshProperty.TransformOrigin]: Vec2;
};

const enum ObjectComponentProperty {
    Mesh,
    Matrix,
}

export type ObjectComponent = {
    [ObjectComponentProperty.Mesh]: ModelMesh;
    [ObjectComponentProperty.Matrix]: Matrix3;
};

const enum ModelProperty {
    Meshes,
    ParentMap,
    TransformOrder,
}

export type Model = {
    [ModelProperty.Meshes]: Array<ModelMesh>;
    [ModelProperty.ParentMap]: Array<number>;
    [ModelProperty.TransformOrder]: Array<number>;
};

const enum ObjectProperty {
    Components,
    Model,
    Transform,
    Subobjects,
    ColorOverrides,
}

export type Object = {
    [ObjectProperty.Components]: Array<ObjectComponent>;
    [ObjectProperty.Model]: Model;
    [ObjectProperty.Transform]: Matrix3;
    [ObjectProperty.Subobjects]: {
        [componentId: number]: Object;
    };
    [ObjectProperty.ColorOverrides]: {
        [componentId: number]: ColorRGB;
    };
};

export const modelCreate = (program: Program, data: ModelData): Model => {
    const meshes = data[ModelDataProperty.Polygons].map(polygon => modelMeshFromPolygon(program, polygon));

    const calculateLevel = (index: number) => {
        let level = 0;
        let current = index;
        while (typeof data[ModelDataProperty.ParentMap][current] === 'number') {
            level++;
            current = data[ModelDataProperty.ParentMap][current];
        }

        return level;
    };

    const transformOrder = data[ModelDataProperty.ParentMap].map((parentId, index) => index);
    transformOrder.sort((a, b) => calculateLevel(a) - calculateLevel(b));

    return {
        [ModelProperty.Meshes]: meshes,
        [ModelProperty.ParentMap]: data[ModelDataProperty.ParentMap],
        [ModelProperty.TransformOrder]: transformOrder,
    };
};

export const objectCreate = (
    model: Model,
    subobjects: Object[ObjectProperty.Subobjects] = {},
    colorOverrides: Object[ObjectProperty.ColorOverrides] = {}
): Object => {
    const components = model[ModelProperty.Meshes].map(mesh => objectComponentFromMesh(mesh));

    return {
        [ObjectProperty.Components]: components,
        [ObjectProperty.Model]: model,
        [ObjectProperty.Transform]: matrixCreate(),
        [ObjectProperty.Subobjects]: subobjects,
        [ObjectProperty.ColorOverrides]: colorOverrides,
    };
};

const objectComponentFromMesh = (mesh: ModelMesh): ObjectComponent => {
    return {
        [ObjectComponentProperty.Mesh]: mesh,
        [ObjectComponentProperty.Matrix]: matrixCreate(),
    };
};

export const objectTransformComponent = (object: Object, componentId: number) => {
    const component = object[ObjectProperty.Components][componentId];
    const subobject = object[ObjectProperty.Subobjects][componentId];
    const matrix = subobject ? objectGetRootTransform(subobject) : component[ObjectComponentProperty.Matrix];

    const parentId = object[ObjectProperty.Model][ModelProperty.ParentMap][componentId];
    if (typeof parentId === 'number') {
        matrixCopy(matrix, object[ObjectProperty.Components][parentId][ObjectComponentProperty.Matrix]);
    } else {
        matrixCopy(matrix, object[ObjectProperty.Transform]);
    }
    matrixTranslateVector(matrix, component[ObjectComponentProperty.Mesh][ModelMeshProperty.TransformOrigin]);

    if (subobject) {
        objectApplyTransforms(subobject);
    }
};

export const objectApplyTransforms = (object: Object) => {
    for (const componentId of object[ObjectProperty.Model][ModelProperty.TransformOrder]) {
        objectTransformComponent(object, componentId);
    }
};

export const objectDraw = (object: Object, program: Program) => {
    const componentsLength = object[ObjectProperty.Components].length;
    for (let componentId = 0; componentId < componentsLength; componentId++) {
        const subobject = object[ObjectProperty.Subobjects][componentId];
        if (subobject !== undefined) {
            if (subobject !== null) {
                matrixCopy(objectGetRootTransform(subobject), objectGetComponentTransform(object, componentId));
                objectDraw(subobject, program);
            }
            continue;
        }

        const component = object[ObjectProperty.Components][componentId];
        glSetModelTransform(program, component[ObjectComponentProperty.Matrix]);
        const colorOverride = object[ObjectProperty.ColorOverrides][componentId];
        glMeshDraw(program, component[ObjectComponentProperty.Mesh][ModelMeshProperty.Mesh], colorOverride);
    }
};

const modelMeshFromPolygon = (program: Program, polygon: Polygon): ModelMesh => {
    return {
        [ModelMeshProperty.Mesh]: glMeshCreate(
            program,
            polygon[PolygonProperty.Vertices],
            polygon[PolygonProperty.Indices],
            polygon[PolygonProperty.Color]
        ),
        [ModelMeshProperty.TransformOrigin]: vectorCreate(...(polygon[PolygonProperty.TransformOrigin] || [0, 0])),
    };
};

export const objectGetComponentTransform = (object: Object, componentPath: number) =>
    object[ObjectProperty.Components][componentPath][ObjectComponentProperty.Matrix];

export const objectGetRootTransform = (object: Object) => object[ObjectProperty.Transform];

export const objectGetComponentTransformOrder = (object: Object) =>
    object[ObjectProperty.Model][ModelProperty.TransformOrder];
