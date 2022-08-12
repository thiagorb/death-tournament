const enum PerlinProperty {
    Gradients,
    Memory,
}

const enum PerlinVec2Property {
    X,
    Y,
}

type PerlinVec2 = {
    [PerlinVec2Property.X]: number;
    [PerlinVec2Property.Y]: number;
};

type Perlin = {
    [PerlinProperty.Gradients]: Map<number, Map<number, PerlinVec2>>;
    [PerlinProperty.Memory]: Map<number, Map<number, number>>;
};

export const perlinCreate = (): Perlin => ({
    [PerlinProperty.Gradients]: new Map(),
    [PerlinProperty.Memory]: new Map(),
});

export const perlinGet = (perlin: Perlin, x: number, y: number): number => {
    if (!perlin[PerlinProperty.Memory].has(x)) {
        perlin[PerlinProperty.Memory].set(x, new Map());
    }

    const memoryX = perlin[PerlinProperty.Memory].get(x);

    if (memoryX.has(y)) {
        return memoryX.get(y);
    }

    const xf = Math.floor(x);
    const yf = Math.floor(y);
    const tl = perlinDotProdGrid(perlin, x, y, xf, yf);
    const tr = perlinDotProdGrid(perlin, x, y, xf + 1, yf);
    const bl = perlinDotProdGrid(perlin, x, y, xf, yf + 1);
    const br = perlinDotProdGrid(perlin, x, y, xf + 1, yf + 1);
    const xt = interp(x - xf, tl, tr);
    const xb = interp(x - xf, bl, br);
    const v = interp(y - yf, xt, xb);
    memoryX.set(y, v);

    return v;
};

const perlinDotProdGrid = (perlin: Perlin, x: number, y: number, vx: number, vy: number): number => {
    if (!perlin[PerlinProperty.Gradients].has(vx)) {
        perlin[PerlinProperty.Gradients].set(vx, new Map());
    }

    const gradientsX = perlin[PerlinProperty.Gradients].get(vx);

    let vector: PerlinVec2;
    if (gradientsX.has(vy)) {
        vector = gradientsX.get(vy);
    } else {
        vector = randomVector();
        gradientsX.set(vy, vector);
    }

    return (x - vx) * vector[PerlinVec2Property.X] + (y - vy) * vector[PerlinVec2Property.Y];
};

const randomVector = (): PerlinVec2 => {
    const theta = Math.random() * 2 * Math.PI;
    return [Math.cos(theta), Math.sin(theta)];
};

const smootherstep = (x: number) => 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
const interp = (x: number, a: number, b: number): number => a + smootherstep(x) * (b - a);
