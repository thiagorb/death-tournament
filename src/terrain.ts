import { vectorCreate, vectorProduct } from './glm';
import { Mesh, meshCreate, MeshCreationContext, MeshCreationContextProperty } from './mesh';
import { perlinCreate, perlinGet } from './perlin';

const randomPolynomial = (maxPower: number) => {
    const coefficients = [];
    for (let i = 0; i <= maxPower; i++) {
        for (let j = 0; j <= maxPower; j++) {
            coefficients.push(3 * (Math.random() * 2 - 1));
        }
    }

    return (x: number, y: number) => {
        let result = 0;
        for (let i = 0; i <= maxPower; i++) {
            for (let j = 0; j <= maxPower; j++) {
                result += coefficients[i * maxPower + j] * Math.pow(x, i) * Math.pow(y, j);
            }
        }
        return result;
    };
};

export const terrainCreate = (
    context: MeshCreationContext,

    xSteps: number,
    ySteps: number,
    width: number,
    height: number,
    depth: number
): Mesh => {
    const vertices = [];
    const normals = [];
    const indices = [];
    const colors = [];

    const polynomial = randomPolynomial(5);
    let maxZ = -Infinity;
    let minZ = Infinity;
    const xStep = width / xSteps;
    const yStep = height / ySteps;

    const heightMap = [];
    const perlin = perlinCreate();
    for (let x = 0; x < xSteps; x++) {
        heightMap.push([]);
        for (let y = 0; y < ySteps; y++) {
            const xPos = x / (xSteps - 1);
            const yPos = y / (ySteps - 1);
            const z =
                perlinGet(perlin, xPos * 2, yPos * 2) * 3 +
                perlinGet(perlin, xPos * 5, yPos * 5) +
                perlinGet(perlin, xPos * 20, yPos * 20) * 0.4;
            // const z = Math.cos(x * 0.2) * Math.cos(y * 0.2) * depth; // polynomial(xPos, yPos);
            maxZ = Math.max(maxZ, z);
            minZ = Math.min(minZ, z);
            heightMap[x].push(z);
        }
    }

    //*
    for (let x = 0; x < xSteps; x++) {
        for (let y = 0; y < ySteps; y++) {
            const xPos = x / (xSteps - 1);
            const yPos = y / (ySteps - 1);
            const distanceToCenter = Math.min(1, Math.sqrt(Math.pow(xPos * 2 - 1, 2) + Math.pow(yPos * 2 - 1, 2)));
            const blend = parametricBlend(Math.max(0, 1 - distanceToCenter ** 5));
            heightMap[x][y] = (((heightMap[x][y] - minZ) / (maxZ - minZ)) * blend - 0.5) * (2 * depth);
        }
    }

    for (let i = 0; i <= 1.0; i += 0.1) {
        console.log(i, parametricBlend(i));
    }
    //*/

    const calculateNormal = (x: number, y: number) => {
        const normal = vectorCreate(0, 0, 1);

        if (x < xSteps - 1 && y < ySteps - 1) {
            vectorProduct(
                normal,
                vectorCreate(xStep, 0, heightMap[x + 1][y] - heightMap[x][y]),
                vectorCreate(0, yStep, heightMap[x][y + 1] - heightMap[x][y])
            );
        }

        return normal;
    };

    const sandColor: [number, number, number] = [0.9, 0.9, 0.8];

    for (let x = 0; x < xSteps; x++) {
        for (let y = 0; y < ySteps; y++) {
            const xPos = x / (xSteps - 1);
            const yPos = y / (ySteps - 1);

            vertices.push(xPos * width);
            vertices.push(yPos * height);
            vertices.push(heightMap[x][y]);

            normals.push(...calculateNormal(x, y));

            const snowHeight = perlinGet(perlin, xPos * 10, yPos * 10);
            if (heightMap[x][y] > 0.8 * (depth + 10 * snowHeight)) {
                colors.push(1, 1, 1);
            } else if (heightMap[x][y] > 0) {
                colors.push(0, 0.6, 0);
            } else {
                colors.push(...sandColor);
            }
        }
    }

    for (let x = 0; x < xSteps - 1; x++) {
        for (let y = 0; y < ySteps - 1; y++) {
            indices.push(x * ySteps + y);
            indices.push((x + 1) * ySteps + y);
            indices.push(x * ySteps + y + 1);

            indices.push(x * ySteps + y + 1);
            indices.push((x + 1) * ySteps + y);
            indices.push((x + 1) * ySteps + y + 1);
        }
    }

    {
        // bottom
        vertices.push(-1000, -1000, -depth);
        vertices.push(1000, -1000, -depth);
        vertices.push(1000, 1000, -depth);
        vertices.push(-1000, 1000, -depth);
        colors.push(...sandColor);
        colors.push(...sandColor);
        colors.push(...sandColor);
        colors.push(...sandColor);
        normals.push(0, 0, 1);
        normals.push(0, 0, 1);
        normals.push(0, 0, 1);
        normals.push(0, 0, 1);

        indices.push(vertices.length / 3 - 4);
        indices.push(vertices.length / 3 - 3);
        indices.push(vertices.length / 3 - 1);
        indices.push(vertices.length / 3 - 1);
        indices.push(vertices.length / 3 - 3);
        indices.push(vertices.length / 3 - 2);
    }

    return meshCreate(context, vertices, colors, normals, indices);
};

const parametricBlend = (t: number) => {
    const sqt = t * t;
    return sqt / (2 * (sqt - t) + 1);
};
