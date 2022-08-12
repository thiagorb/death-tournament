export type Matrix4 = Float32Array & { __matrix: boolean };
export type Vec3 = Float32Array & { __vector: boolean };

export const matrixCreate = (): Matrix4 => {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) as Matrix4;
};

export const vectorCreate = (x: number = 0, y: number = 0, z: number = 0): Vec3 => {
    return new Float32Array([x, y, z]) as Vec3;
};

export const matrixMultiply = (result: Matrix4, a: Matrix4, b: Matrix4): Matrix4 => {
    for (let i = 0; i < 16; i++) {
        const row = (i / 4) | 0;
        const col = i % 4;

        result[i] =
            b[row * 4 + 0] * a[0 * 4 + col] +
            b[row * 4 + 1] * a[1 * 4 + col] +
            b[row * 4 + 2] * a[2 * 4 + col] +
            b[row * 4 + 3] * a[3 * 4 + col];
    }

    return result;
};

export const matrixMultiplyVector = (result: Vec3, m: Matrix4): void => {
    const v0 = m[0 * 4 + 0] * result[0] + m[0 * 4 + 1] * result[1] + m[0 * 4 + 2] * result[2] + m[0 * 4 + 3];
    const v1 = m[1 * 4 + 0] * result[0] + m[1 * 4 + 1] * result[1] + m[1 * 4 + 2] * result[2] + m[1 * 4 + 3];
    const v2 = m[2 * 4 + 0] * result[0] + m[2 * 4 + 1] * result[1] + m[2 * 4 + 2] * result[2] + m[2 * 4 + 3];
    result[0] = v0;
    result[1] = v1;
    result[2] = v2;
};

export const matrixSetIdentity = (result: Matrix4): Matrix4 => {
    Object.assign(result, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    return result;
};

export const matrixRotateX = (matrix: Matrix4, angle: number): void => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const mv1 = matrix[1];
    const mv5 = matrix[5];
    const mv9 = matrix[9];

    matrix[1] = matrix[1] * cos - matrix[2] * sin;
    matrix[5] = matrix[5] * cos - matrix[6] * sin;
    matrix[9] = matrix[9] * cos - matrix[10] * sin;

    matrix[2] = matrix[2] * cos + mv1 * sin;
    matrix[6] = matrix[6] * cos + mv5 * sin;
    matrix[10] = matrix[10] * cos + mv9 * sin;
};

export const matrixRotateY = (matrix: Matrix4, angle: number): void => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const mv0 = matrix[0];
    const mv4 = matrix[4];
    const mv8 = matrix[8];

    matrix[0] = cos * matrix[0] + sin * matrix[2];
    matrix[4] = cos * matrix[4] + sin * matrix[6];
    matrix[8] = cos * matrix[8] + sin * matrix[10];

    matrix[2] = cos * matrix[2] - sin * mv0;
    matrix[6] = cos * matrix[6] - sin * mv4;
    matrix[10] = cos * matrix[10] - sin * mv8;
};

export const matrixRotateZ = (matrix: Matrix4, angle: number): void => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const mv0 = matrix[0];
    const mv4 = matrix[4];
    const mv8 = matrix[8];

    matrix[0] = cos * matrix[0] - sin * matrix[1];
    matrix[4] = cos * matrix[4] - sin * matrix[5];
    matrix[8] = cos * matrix[8] - sin * matrix[9];

    matrix[1] = cos * matrix[1] + sin * mv0;
    matrix[5] = cos * matrix[5] + sin * mv4;
    matrix[9] = cos * matrix[9] + sin * mv8;
};

export const matrixScaleX = (result: Matrix4, x: number): void => {
    result[0] *= x;
    result[4] *= x;
    result[8] *= x;
};

export const matrixScaleY = (result: Matrix4, y: number): void => {
    result[1] *= y;
    result[5] *= y;
    result[9] *= y;
};

export const matrixScaleZ = (result: Matrix4, z: number): void => {
    result[2] *= z;
    result[6] *= z;
    result[10] *= z;
};

export const matrixTranslateX = (result: Matrix4, x: number): void => {
    result[12] += x;
};

export const matrixTranslateY = (result: Matrix4, y: number): void => {
    result[13] += y;
};

export const matrixTranslateZ = (result: Matrix4, z: number): void => {
    result[14] += z;
};

export const matrixTranslateVector = (result: Matrix4, vector: Vec3): void => {
    matrixTranslateX(result, vector[0]);
    matrixTranslateY(result, vector[1]);
    matrixTranslateZ(result, vector[2]);
};

export const vectorAdd = (result: Vec3, add: Vec3): void => {
    result[0] += add[0];
    result[1] += add[1];
    result[2] += add[2];
};

export const matrixSetProjection = (result: Matrix4, angle: number, a: number, zMin: number, zMax: number): Matrix4 => {
    matrixSetIdentity(result);
    const ang = Math.tan((angle * 0.5 * Math.PI) / 180);

    result[0] = 0.5 / ang;
    result[5] = (0.5 * a) / ang;
    result[10] = -(zMax + zMin) / (zMax - zMin);
    result[11] = -1;
    result[14] = (-2 * zMax * zMin) / (zMax - zMin);

    return result;
};

export const matrixSetOrtho = (
    result: Matrix4,
    left: number,
    right: number,
    bottom: number,
    top: number,
    zMin: number,
    zMax: number
): Matrix4 => {
    matrixSetIdentity(result);
    result[0] = 2 / (right - left);
    result[5] = 2 / (top - bottom);
    result[10] = -2 / (zMax - zMin);
    result[12] = -(right + left) / (right - left);
    result[13] = -(top + bottom) / (top - bottom);
    result[14] = -(zMax + zMin) / (zMax - zMin);

    return result;
};

export const matrixCopy = (result: Matrix4, a: Matrix4): Matrix4 => {
    Object.assign(result, a);

    return result;
};

export const vectorProduct = (result: Vec3, a: Vec3, b: Vec3): Vec3 => {
    result[0] = a[1] * b[2] - a[2] * b[1];
    result[1] = a[2] * b[0] - a[0] * b[2];
    result[2] = a[0] * b[1] - a[1] * b[0];

    return result;
};
