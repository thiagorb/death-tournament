import { ColorRGB, glMeshDraw, glMeshPolygonCreate, glModelMultiply, glModelPop, glModelPush, glModelTranslate, Mesh, Program } from './gl';
import { Matrix3, matrixCreate, Vec2 } from './glm';

const enum PolygonProperty {
    Vertices,
    Color,
    TransformOrigin,
    Subpolygons,
    SubpolygonsBack,
    SubpolygonsFront,
}

type Polygon = {
    [PolygonProperty.Vertices]: Array<Vec2>;
    [PolygonProperty.Color]: ColorRGB;
    [PolygonProperty.TransformOrigin]: [number, number];
    [PolygonProperty.Subpolygons]?: Array<Polygon>;
    [PolygonProperty.SubpolygonsBack]?: Array<number>;
    [PolygonProperty.SubpolygonsFront]?: Array<number>;
};

const enum ModelDataProperty {
    Polygons,
}

export type ModelData = {
    [ModelDataProperty.Polygons]: Array<Polygon>;
};

const enum ModelMeshProperty {
    Mesh,
    Submeshes,
    SubmeshesBack,
    SubmeshesFront,
    TransformOrigin,
}

export type ModelMesh = {
    [ModelMeshProperty.Mesh]: Mesh;
    [ModelMeshProperty.Submeshes]: Array<ModelMesh>;
    [ModelMeshProperty.SubmeshesBack]: Array<number>;
    [ModelMeshProperty.SubmeshesFront]: Array<number>;
    [ModelMeshProperty.TransformOrigin]?: [number, number];
};

const enum ModelProperty {
    Meshes,
}

const enum ObjectComponentProperty {
    Mesh,
    Subcomponents,
    SubcomponentsBack,
    SubcomponentsFront,
    Matrix,
}

export type ObjectComponent = {
    [ObjectComponentProperty.Mesh]: ModelMesh;
    [ObjectComponentProperty.Subcomponents]: Array<ObjectComponent>;
    [ObjectComponentProperty.SubcomponentsBack]: Array<number>;
    [ObjectComponentProperty.SubcomponentsFront]: Array<number>;
    [ObjectComponentProperty.Matrix]: Matrix3;
};

const enum ObjectProperty {
    Components,
}

export type Object = {
    [ObjectProperty.Components]: Array<ObjectComponent>;
};

export type Model = {
    [ModelProperty.Meshes]: Array<ModelMesh>;
};

export const modelCreate = (program: Program, data: ModelData): Model => {
    return {
        [ModelProperty.Meshes]: data[ModelDataProperty.Polygons].map(polygon => modelMeshFromPolygon(program, polygon)),
    };
};

export const objectCreate = (model: Model): Object => {
    return {
        [ObjectProperty.Components]: model[ModelProperty.Meshes].map(mesh => objectComponentFromMesh(mesh)),
    };
};

const objectComponentFromMesh = (mesh: ModelMesh): ObjectComponent => {
    return {
        [ObjectComponentProperty.Mesh]: mesh,
        [ObjectComponentProperty.Subcomponents]: mesh[ModelMeshProperty.Submeshes].map(sm => objectComponentFromMesh(sm)),
        [ObjectComponentProperty.SubcomponentsBack]: mesh[ModelMeshProperty.SubmeshesBack],
        [ObjectComponentProperty.SubcomponentsFront]: mesh[ModelMeshProperty.SubmeshesFront],
        [ObjectComponentProperty.Matrix]: matrixCreate(),
    };
};

export const objectDraw = (object: Object, program: Program) => {
    for (const component of object[ObjectProperty.Components]) {
        objectDrawComponent(program, component);
    }
};

const objectDrawComponent = (program: Program, component: ObjectComponent) => {
    glModelPush(program);
    const origin = component[ObjectComponentProperty.Mesh][ModelMeshProperty.TransformOrigin] ?? [0, 0];
    glModelTranslate(program, origin[0], origin[1]);
    glModelMultiply(program, component[ObjectComponentProperty.Matrix]);
    for (const subcomponent of component[ObjectComponentProperty.SubcomponentsBack]) {
        objectDrawComponent(program, component[ObjectComponentProperty.Subcomponents][subcomponent]);
    }
    glMeshDraw(program, component[ObjectComponentProperty.Mesh][ModelMeshProperty.Mesh]);
    for (const subcomponent of component[ObjectComponentProperty.SubcomponentsFront]) {
        objectDrawComponent(program, component[ObjectComponentProperty.Subcomponents][subcomponent]);
    }
    glModelPop(program);
};

const modelMeshFromPolygon = (program: Program, polygon: Polygon): ModelMesh => {
    return {
        [ModelMeshProperty.Mesh]: glMeshPolygonCreate(
            program,
            polygon[PolygonProperty.Vertices].map((v, i) => [v, polygon[PolygonProperty.Color]])
        ),
        [ModelMeshProperty.Submeshes]: (polygon[PolygonProperty.Subpolygons] ?? []).map(sp => modelMeshFromPolygon(program, sp)),
        [ModelMeshProperty.SubmeshesBack]: polygon[PolygonProperty.SubpolygonsBack] ?? [],
        [ModelMeshProperty.SubmeshesFront]: polygon[PolygonProperty.SubpolygonsFront] ?? [],
        [ModelMeshProperty.TransformOrigin]: polygon[PolygonProperty.TransformOrigin],
    };
};

export const objectGetComponentTransform = (object: Object, componentPath: Array<number>) => {
    let component = object[ObjectProperty.Components][componentPath[0]];
    for (let i = 1; i < componentPath.length; i++) {
        component = component[ObjectComponentProperty.Subcomponents][componentPath[i]];
    }

    return component[ObjectComponentProperty.Matrix];
};
