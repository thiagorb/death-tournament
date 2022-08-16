export type Matrix3 = Float32Array & { __matrix: boolean };
export type Vec2 = Float32Array & { __vector: boolean };

export const matrixCreate = (): Matrix3 => {
    return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) as Matrix3;
};

export const vectorCreate = (x: number = 0, y: number = 0): Vec2 => {
    return new Float32Array([x, y]) as Vec2;
};

export const matrixMultiply = (result: Matrix3, a: Matrix3, b: Matrix3): Matrix3 => {
    for (let i = 0; i < 9; i++) {
        const row = (i / 3) | 0;
        const col = i % 3;

        result[i] = b[row * 3 + 0] * a[0 * 3 + col] + b[row * 3 + 1] * a[1 * 3 + col] + b[row * 3 + 2] * a[2 * 3 + col];
    }

    return result;
};

export const matrixMultiplyVector = (result: Vec2, m: Matrix3): void => {
    const v0 = m[0 * 3 + 0] * result[0] + m[0 * 3 + 1] * result[1] + m[0 * 3 + 2] * result[2];
    const v1 = m[1 * 3 + 0] * result[0] + m[1 * 3 + 1] * result[1] + m[1 * 3 + 2] * result[2];
    result[0] = v0;
    result[1] = v1;
};

export const matrixSetIdentity = (result: Matrix3): Matrix3 => {
    Object.assign(result, [1, 0, 0, 0, 1, 0, 0, 0, 1]);

    return result;
};

export const matrixRotate = (matrix: Matrix3, angle: number): void => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m00 = matrix[0 * 3 + 0];
    const m01 = matrix[0 * 3 + 1];
    const m02 = matrix[0 * 3 + 2];
    const m10 = matrix[1 * 3 + 0];
    const m11 = matrix[1 * 3 + 1];
    const m12 = matrix[1 * 3 + 2];
    matrix[0 * 3 + 0] = c * m00 - s * m10;
    matrix[0 * 3 + 1] = c * m01 - s * m11;
    matrix[0 * 3 + 2] = c * m02 - s * m12;
    matrix[1 * 3 + 0] = s * m00 + c * m10;
    matrix[1 * 3 + 1] = s * m01 + c * m11;
    matrix[1 * 3 + 2] = s * m02 + c * m12;
};

export const matrixScale = (result: Matrix3, x: number, y: number): void => {
    result[0 * 3 + 0] *= x;
    result[1 * 3 + 1] *= y;
};

export const matrixTranslate = (result: Matrix3, x: number, y: number): void => {
    result[2 * 3 + 0] += x;
    result[2 * 3 + 1] += y;
};

export const vectorAdd = (result: Vec2, add: Vec2): void => {
    result[0] += add[0];
    result[1] += add[1];
};

export const matrixSetOrtho = (
    result: Matrix3,
    left: number,
    right: number,
    bottom: number,
    top: number,
    zMin: number,
    zMax: number
): Matrix3 => {
    matrixSetIdentity(result);
    result[0] = 2 / (right - left);
    result[5] = 2 / (top - bottom);
    result[10] = -2 / (zMax - zMin);
    result[12] = -(right + left) / (right - left);
    result[13] = -(top + bottom) / (top - bottom);
    result[14] = -(zMax + zMin) / (zMax - zMin);

    return result;
};

export const matrixCopy = (result: Matrix3, a: Matrix3): Matrix3 => {
    Object.assign(result, a);

    return result;
};
