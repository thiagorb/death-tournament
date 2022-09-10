import { ColorRGB, glMeshDraw, glMeshCreate, Mesh, Program, glSetModelTransform } from './gl';
import { Matrix3, matrixCopy, matrixCreate, matrixTranslateVector, Vec2, vectorCreate } from './glm';

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
}

export type Object = {
    [ObjectProperty.Components]: Array<ObjectComponent>;
    [ObjectProperty.Model]: Model;
    [ObjectProperty.Transform]: Matrix3;
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

export const objectCreate = (model: Model): Object => {
    const components = model[ModelProperty.Meshes].map(mesh => objectComponentFromMesh(mesh));

    return {
        [ObjectProperty.Components]: components,
        [ObjectProperty.Model]: model,
        [ObjectProperty.Transform]: matrixCreate(),
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
    const matrix = component[ObjectComponentProperty.Matrix];
    const parentId = object[ObjectProperty.Model][ModelProperty.ParentMap][componentId];
    if (typeof parentId === 'number') {
        matrixCopy(matrix, object[ObjectProperty.Components][parentId][ObjectComponentProperty.Matrix]);
    } else {
        matrixCopy(matrix, object[ObjectProperty.Transform]);
    }
    matrixTranslateVector(matrix, component[ObjectComponentProperty.Mesh][ModelMeshProperty.TransformOrigin]);
};

export const objectApplyTransforms = (object: Object) => {
    for (const componentId of object[ObjectProperty.Model][ModelProperty.TransformOrder]) {
        objectTransformComponent(object, componentId);
    }
};

export const objectDraw = (object: Object, program: Program) => {
    for (const component of object[ObjectProperty.Components]) {
        // if component is mesh, render as usual
        // if component is subobject, call objectDraw
        glSetModelTransform(program, component[ObjectComponentProperty.Matrix]);
        glMeshDraw(program, component[ObjectComponentProperty.Mesh][ModelMeshProperty.Mesh]);
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
