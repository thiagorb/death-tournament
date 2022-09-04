import {
    ColorRGB,
    glMeshDraw,
    glMeshCreate,
    glModelMultiply,
    glModelPop,
    glModelPush,
    glModelTranslateVector,
    Mesh,
    Program,
} from './gl';
import { Matrix3, matrixCreate, Vec2 } from './glm';
import functionCreate from './function';

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

const enum PolygonHierarchyProperties {
    Index,
    SubpolygonsBack,
    SubpolygonsFront,
}

type PolygonHierarchy = {
    [PolygonHierarchyProperties.Index]: number;
    [PolygonHierarchyProperties.SubpolygonsBack]?: Array<PolygonHierarchy>;
    [PolygonHierarchyProperties.SubpolygonsFront]?: Array<PolygonHierarchy>;
};

export const enum ModelDataProperty {
    Polygons,
    PolygonHierarchy,
}

export type ModelData = {
    [ModelDataProperty.Polygons]: Array<Polygon>;
    [ModelDataProperty.PolygonHierarchy]: Array<PolygonHierarchy>;
};

const enum ModelMeshProperty {
    Mesh,
    TransformOrigin,
}

export type ModelMesh = {
    [ModelMeshProperty.Mesh]: Mesh;
    [ModelMeshProperty.TransformOrigin]: [number, number];
};

const enum ObjectComponentProperty {
    Mesh,
    Matrix,
    RequiresPush,
}

export type ObjectComponent = {
    [ObjectComponentProperty.Mesh]: ModelMesh;
    [ObjectComponentProperty.Matrix]: Matrix3;
    [ObjectComponentProperty.RequiresPush]: boolean;
};

const enum ModelProperty {
    Meshes,
    DrawFunction,
}

export type Model = {
    [ModelProperty.Meshes]: Array<ModelMesh>;
    [ModelProperty.DrawFunction]: (o: Object, p: Program) => void;
};

const enum ObjectProperty {
    Components,
    Model,
}

export type Object = {
    [ObjectProperty.Components]: Array<ObjectComponent>;
    [ObjectProperty.Model]: Model;
};

const drawFunctionCreate = (polygonHierarchyLevel: Array<PolygonHierarchy>) => {
    const object = 'o';
    const program = 'p';
    const objectComponentDrawStart = 's';
    const objectComponentDrawEnd = 'e';
    const glMeshDraw = 'd';

    const visitInOrder = (polygonHierarchyLevel: Array<PolygonHierarchy>, drawStatements: Array<string> = []) => {
        for (const polygonHierarhcy of polygonHierarchyLevel ?? []) {
            const index = polygonHierarhcy[PolygonHierarchyProperties.Index];
            const component = `${object}[${ObjectProperty.Components}][${index}]`;
            drawStatements.push(`${objectComponentDrawStart}(${component},${program})`);

            visitInOrder(polygonHierarhcy[PolygonHierarchyProperties.SubpolygonsBack], drawStatements);

            drawStatements.push(
                `${glMeshDraw}(${program},${component}[${ObjectComponentProperty.Mesh}][${ModelMeshProperty.Mesh}])`
            );

            visitInOrder(polygonHierarhcy[PolygonHierarchyProperties.SubpolygonsFront], drawStatements);

            drawStatements.push(`${objectComponentDrawEnd}(${component},${program})`);
        }
        return drawStatements;
    };

    const body = `return (${object},${program})=>{${visitInOrder(polygonHierarchyLevel).join(';')}}`;
    return functionCreate([objectComponentDrawStart, glMeshDraw, objectComponentDrawEnd], body);
};

export const modelCreate = (program: Program, data: ModelData): Model => {
    const meshes = data[ModelDataProperty.Polygons].map(polygon => modelMeshFromPolygon(program, polygon));

    return {
        [ModelProperty.Meshes]: meshes,
        [ModelProperty.DrawFunction]: drawFunctionCreate(data[ModelDataProperty.PolygonHierarchy])(
            objectComponentDrawStart,
            glMeshDraw,
            objectComponentDrawEnd
        ),
    };
};

export const objectCreate = (model: Model): Object => {
    const components = model[ModelProperty.Meshes].map(mesh => objectComponentFromMesh(mesh));

    return {
        [ObjectProperty.Components]: components,
        [ObjectProperty.Model]: model,
    };
};

const objectComponentFromMesh = (mesh: ModelMesh): ObjectComponent => {
    return {
        [ObjectComponentProperty.Mesh]: mesh,
        [ObjectComponentProperty.Matrix]: null,
        [ObjectComponentProperty.RequiresPush]: false,
    };
};

const objectComponentDrawStart = (component: ObjectComponent, program: Program) => {
    const origin = component[ObjectComponentProperty.Mesh][ModelMeshProperty.TransformOrigin];
    const differentOrigin = origin[0] !== 0 || origin[1] !== 0;
    const hasTransform = component[ObjectComponentProperty.Matrix] !== null;
    component[ObjectComponentProperty.RequiresPush] = differentOrigin || hasTransform;
    if (component[ObjectComponentProperty.RequiresPush]) {
        glModelPush(program);
        glModelTranslateVector(program, component[ObjectComponentProperty.Mesh][ModelMeshProperty.TransformOrigin]);
        if (hasTransform) {
            glModelMultiply(program, component[ObjectComponentProperty.Matrix]);
        }
    }
};

const objectComponentDrawEnd = (component: ObjectComponent, program: Program) => {
    if (component[ObjectComponentProperty.RequiresPush]) {
        glModelPop(program);
    }
};

export const objectDraw = (object: Object, program: Program) =>
    object[ObjectProperty.Model][ModelProperty.DrawFunction](object, program);

const modelMeshFromPolygon = (program: Program, polygon: Polygon): ModelMesh => {
    return {
        [ModelMeshProperty.Mesh]: glMeshCreate(
            program,
            polygon[PolygonProperty.Vertices],
            polygon[PolygonProperty.Indices],
            polygon[PolygonProperty.Color]
        ),
        [ModelMeshProperty.TransformOrigin]: polygon[PolygonProperty.TransformOrigin] ?? [0, 0],
    };
};

export const objectGetComponentTransform = (object: Object, componentPath: number) => {
    const component = object[ObjectProperty.Components][componentPath];
    if (component[ObjectComponentProperty.Matrix] === null) {
        component[ObjectComponentProperty.Matrix] = matrixCreate();
    }

    return component[ObjectComponentProperty.Matrix];
};
