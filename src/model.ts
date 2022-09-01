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
    ReversedDrawInstructions,
}

export type Model = {
    [ModelProperty.Meshes]: Array<ModelMesh>;
    [ModelProperty.ReversedDrawInstructions]: Array<DrawInstruction>;
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

export const modelCreate = (program: Program, data: ModelData): Model => {
    const meshes = data[ModelDataProperty.Polygons].map(polygon => modelMeshFromPolygon(program, polygon));
    const drawInstructions: Array<DrawInstruction> = [];

    const visitInOrder = (polygonHierarchyLevel: Array<PolygonHierarchy>) => {
        for (const polygonHierarhcy of polygonHierarchyLevel) {
            drawInstructions.push({
                [DrawInstructionProperties.Type]: DrawInstructionType.Begin,
                [DrawInstructionProperties.ComponentIndex]: polygonHierarhcy[PolygonHierarchyProperties.Index],
            });

            visitInOrder(polygonHierarhcy[PolygonHierarchyProperties.SubpolygonsBack]);

            drawInstructions.push({
                [DrawInstructionProperties.Type]: DrawInstructionType.Draw,
                [DrawInstructionProperties.ComponentIndex]: polygonHierarhcy[PolygonHierarchyProperties.Index],
            });

            visitInOrder(polygonHierarhcy[PolygonHierarchyProperties.SubpolygonsFront]);

            drawInstructions.push({ [DrawInstructionProperties.Type]: DrawInstructionType.End });
        }
    };
    visitInOrder(data[ModelDataProperty.PolygonHierarchy]);

    return {
        [ModelProperty.Meshes]: meshes,
        [ModelProperty.ReversedDrawInstructions]: drawInstructions.reverse(),
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

export const objectDraw = (object: Object, program: Program) => {
    const instructions = object[ObjectProperty.Model][ModelProperty.ReversedDrawInstructions];
    let i = instructions.length;
    while (i--) {
        const instruction = instructions[i];
        switch (instruction[DrawInstructionProperties.Type]) {
            case DrawInstructionType.Begin: {
                const component = object[ObjectProperty.Components][instruction[DrawInstructionProperties.ComponentIndex]];
                glModelPush(program);
                const origin = component[ObjectComponentProperty.Mesh][ModelMeshProperty.TransformOrigin];
                glModelTranslateVector(program, origin);
                glModelMultiply(program, component[ObjectComponentProperty.Matrix]);
                break;
            }
            case DrawInstructionType.Draw: {
                const component = object[ObjectProperty.Components][instruction[DrawInstructionProperties.ComponentIndex]];
                glMeshDraw(program, component[ObjectComponentProperty.Mesh][ModelMeshProperty.Mesh]);
                break;
            }
            case DrawInstructionType.End:
                glModelPop(program);
                break;
        }
    }
};

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
