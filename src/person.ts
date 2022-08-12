import { glSetModel, Program } from './gl';
import { Matrix4, matrixCopy, matrixCreate, matrixScaleX, matrixScaleY, matrixScaleZ, matrixTranslateX } from './glm';
import { Mesh, meshCreate, MeshCreationContext, meshDraw } from './mesh';

const enum PersonProperty {
    LeftArm,
    RightArm,
}

const enum MemberProperty {
    Mesh,
    Transform,
}

type Member = {
    [MemberProperty.Mesh]: Mesh;
    [MemberProperty.Transform]: Matrix4;
};

type Person = {
    [PersonProperty.LeftArm]: Member;
};

const skinColor: [number, number, number] = [1.0, 0.9, 0.8];

const createArmMesh = (context: MeshCreationContext) =>
    meshCreate(
        context,

        // prettier-ignore
        [
            // W
            -1, 0, 0,
            // N
            0, 1, 0,
            // E
            1, 0, 0,
            // S
            0, -1, 0,
            // Bottom
            0, 0, 1,
        ],

        // prettier-ignore
        [
            ...skinColor,
            ...skinColor,
            ...skinColor,
            ...skinColor,
            ...skinColor,
        ],

        // prettier-ignore
        [
            -1, 0, 0,
            0, 1, 0,
            1, 0, 0,
            0, -1, 0,
            0, 0, 1,
        ],

        // prettier-ignore
        [
            // top
            0, 1, 3, 2, 3, 1, 
            // nw
            0, 4, 1,
            // ne
            1, 4, 2,
            // sw
            3, 4, 0, 
            // se
            2, 4, 3,
        ]
    );

export const personCreate = (context: MeshCreationContext) => {
    const armMesh = createArmMesh(context);
    const leftArmMatrix = matrixCreate();
    matrixScaleX(leftArmMatrix, 0.1);
    matrixScaleY(leftArmMatrix, 0.1);

    const rightArmMatrix = matrixCreate();
    matrixCopy(rightArmMatrix, leftArmMatrix);

    matrixTranslateX(leftArmMatrix, -0.5);
    matrixTranslateX(rightArmMatrix, 0.5);

    return {
        [PersonProperty.LeftArm]: {
            [MemberProperty.Mesh]: armMesh,
            [MemberProperty.Transform]: leftArmMatrix,
        },
        [PersonProperty.RightArm]: {
            [MemberProperty.Mesh]: armMesh,
            [MemberProperty.Transform]: rightArmMatrix,
        },
    };
};

export const personDraw = (person: Person, program: Program) => {
    glSetModel(program, person[PersonProperty.LeftArm][MemberProperty.Transform]);
    meshDraw(person[PersonProperty.LeftArm][MemberProperty.Mesh], program);

    glSetModel(program, person[PersonProperty.RightArm][MemberProperty.Transform]);
    meshDraw(person[PersonProperty.RightArm][MemberProperty.Mesh], program);
};
