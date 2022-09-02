import {
    ColorRGB,
    glMeshDraw,
    glMeshPolygonCreate,
    glModelMultiply,
    glModelPop,
    glModelPush,
    glModelTranslateVector,
    Mesh,
    Program,
} from './gl';
import { Matrix3, matrixCreate, Vec2 } from './glm';

const enum PolygonProperty {
    Vertices,
    Color,
    TransformOrigin,
}

type Polygon = {
    [PolygonProperty.Vertices]: Array<Vec2>;
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
    [PolygonHierarchyProperties.SubpolygonsBack]: Array<PolygonHierarchy>;
    [PolygonHierarchyProperties.SubpolygonsFront]: Array<PolygonHierarchy>;
};

const enum ModelDataProperty {
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
}

export type ObjectComponent = {
    [ObjectComponentProperty.Mesh]: ModelMesh;
    [ObjectComponentProperty.Matrix]: Matrix3;
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

const enum DrawInstructionType {
    Begin,
    Draw,
    End,
}

const enum DrawInstructionProperties {
    Type,
    ComponentIndex,
}

type DrawInstruction =
    | { [DrawInstructionProperties.Type]: DrawInstructionType.Begin; [DrawInstructionProperties.ComponentIndex]: number }
    | { [DrawInstructionProperties.Type]: DrawInstructionType.Draw; [DrawInstructionProperties.ComponentIndex]: number }
    | { [DrawInstructionProperties.Type]: DrawInstructionType.End };

const drawFunctionCreate = (polygonHierarchyLevel: Array<PolygonHierarchy>) => {
    const object = 'o';
    const program = 'p';
    const glModelPush = 'b';
    const glModelTranslateVector = 't';
    const glModelMultiply = 'm';
    const glMeshDraw = 'd';
    const glModelPop = 'e';

    const visitInOrder = (polygonHierarchyLevel: Array<PolygonHierarchy>, drawStatements: Array<string> = []) => {
        for (const polygonHierarhcy of polygonHierarchyLevel) {
            const index = polygonHierarhcy[PolygonHierarchyProperties.Index];
            const component = `${object}[${ObjectProperty.Components}][${index}]`;
            drawStatements.push(
                `${glModelPush}(${program})`,
                `${glModelTranslateVector}(${program},${component}[${ObjectComponentProperty.Mesh}][${ModelMeshProperty.TransformOrigin}])`,
                `${glModelMultiply}(${program},${component}[${ObjectComponentProperty.Matrix}])`
            );

            visitInOrder(polygonHierarhcy[PolygonHierarchyProperties.SubpolygonsBack], drawStatements);

            drawStatements.push(`${glMeshDraw}(${program},${component}[${ObjectComponentProperty.Mesh}][${ModelMeshProperty.Mesh}])`);

            visitInOrder(polygonHierarhcy[PolygonHierarchyProperties.SubpolygonsFront], drawStatements);

            drawStatements.push(`${glModelPop}(${program})`);
        }
        return drawStatements;
    };

    const body = `(${object},${program})=>{${visitInOrder(polygonHierarchyLevel).join(';')}}`;
    return eval(`(${glModelPush},${glModelTranslateVector},${glModelMultiply},${glMeshDraw},${glModelPop})=>${body}`);
};

export const modelCreate = (program: Program, data: ModelData): Model => {
    const meshes = data[ModelDataProperty.Polygons].map(polygon => modelMeshFromPolygon(program, polygon));

    return {
        [ModelProperty.Meshes]: meshes,
        [ModelProperty.DrawFunction]: drawFunctionCreate(data[ModelDataProperty.PolygonHierarchy])(
            glModelPush,
            glModelTranslateVector,
            glModelMultiply,
            glMeshDraw,
            glModelPop
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
        [ObjectComponentProperty.Matrix]: matrixCreate(),
    };
};

export const objectDraw = (object: Object, program: Program) => object[ObjectProperty.Model][ModelProperty.DrawFunction](object, program);

const modelMeshFromPolygon = (program: Program, polygon: Polygon): ModelMesh => {
    return {
        [ModelMeshProperty.Mesh]: glMeshPolygonCreate(
            program,
            polygon[PolygonProperty.Vertices].map((v, i) => [v, polygon[PolygonProperty.Color]])
        ),
        [ModelMeshProperty.TransformOrigin]: polygon[PolygonProperty.TransformOrigin] ?? [0, 0],
    };
};

export const objectGetComponentTransform = (object: Object, componentPath: number) => {
    const component = object[ObjectProperty.Components][componentPath];

    return component[ObjectComponentProperty.Matrix];
};
