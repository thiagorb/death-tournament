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
    [ModelMeshProperty.TransformOrigin]: [number, number];
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
    [ObjectComponentProperty.SubcomponentsBack]: Array<ObjectComponent>;
    [ObjectComponentProperty.SubcomponentsFront]: Array<ObjectComponent>;
    [ObjectComponentProperty.Matrix]: Matrix3;
};

const enum ObjectProperty {
    Components,
    InOrderComponents,
    ReversedDrawInstructions,
}

const enum DrawInstructionType {
    Begin,
    Draw,
    End,
}

const enum DrawInstructionProperties {
    Type,
    Component,
}

type DrawInstruction =
    | { [DrawInstructionProperties.Type]: DrawInstructionType.Begin; [DrawInstructionProperties.Component]: ObjectComponent }
    | { [DrawInstructionProperties.Type]: DrawInstructionType.Draw; [DrawInstructionProperties.Component]: ObjectComponent }
    | { [DrawInstructionProperties.Type]: DrawInstructionType.End };

export type Object = {
    [ObjectProperty.Components]: Array<ObjectComponent>;
    [ObjectProperty.InOrderComponents]: Array<ObjectComponent>;
    [ObjectProperty.ReversedDrawInstructions]: Array<DrawInstruction>;
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
    const components = model[ModelProperty.Meshes].map(mesh => objectComponentFromMesh(mesh));
    const inOrder = [];
    const drawInstructions: Array<DrawInstruction> = [];

    const visitInOrder = (components: Array<ObjectComponent>) => {
        for (const component of components) {
            drawInstructions.push({
                [DrawInstructionProperties.Type]: DrawInstructionType.Begin,
                [DrawInstructionProperties.Component]: component,
            });

            visitInOrder(component[ObjectComponentProperty.SubcomponentsBack]);
            inOrder.push(component);
            drawInstructions.push({
                [DrawInstructionProperties.Type]: DrawInstructionType.Draw,
                [DrawInstructionProperties.Component]: component,
            });
            visitInOrder(component[ObjectComponentProperty.SubcomponentsFront]);

            drawInstructions.push({ [DrawInstructionProperties.Type]: DrawInstructionType.End });
        }
    };
    visitInOrder(components);

    return {
        [ObjectProperty.Components]: components,
        [ObjectProperty.InOrderComponents]: inOrder,
        [ObjectProperty.ReversedDrawInstructions]: drawInstructions.reverse(),
    };
};

const objectComponentFromMesh = (mesh: ModelMesh): ObjectComponent => {
    const subcomponents = mesh[ModelMeshProperty.Submeshes].map(sm => objectComponentFromMesh(sm));
    return {
        [ObjectComponentProperty.Mesh]: mesh,
        [ObjectComponentProperty.Subcomponents]: subcomponents,
        [ObjectComponentProperty.SubcomponentsBack]: mesh[ModelMeshProperty.SubmeshesBack].map(i => subcomponents[i]),
        [ObjectComponentProperty.SubcomponentsFront]: mesh[ModelMeshProperty.SubmeshesFront].map(i => subcomponents[i]),
        [ObjectComponentProperty.Matrix]: matrixCreate(),
    };
};

export const objectDraw = (object: Object, program: Program) => {
    const instructions = object[ObjectProperty.ReversedDrawInstructions];
    let i = instructions.length;
    while (i--) {
        const instruction = instructions[i];
        switch (instruction[DrawInstructionProperties.Type]) {
            case DrawInstructionType.Begin: {
                const component = instruction[DrawInstructionProperties.Component];
                glModelPush(program);
                const origin = component[ObjectComponentProperty.Mesh][ModelMeshProperty.TransformOrigin];
                glModelTranslateVector(program, origin);
                glModelMultiply(program, component[ObjectComponentProperty.Matrix]);
                break;
            }
            case DrawInstructionType.Draw: {
                const component = instruction[DrawInstructionProperties.Component];
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
        [ModelMeshProperty.Submeshes]: (polygon[PolygonProperty.Subpolygons] ?? []).map(sp => modelMeshFromPolygon(program, sp)),
        [ModelMeshProperty.SubmeshesBack]: polygon[PolygonProperty.SubpolygonsBack] ?? [],
        [ModelMeshProperty.SubmeshesFront]: polygon[PolygonProperty.SubpolygonsFront] ?? [],
        [ModelMeshProperty.TransformOrigin]: polygon[PolygonProperty.TransformOrigin] ?? [0, 0],
    };
};

export const objectGetComponentTransform = (object: Object, componentPath: number) => {
    const component = object[ObjectProperty.InOrderComponents][componentPath];

    return component[ObjectComponentProperty.Matrix];
};
