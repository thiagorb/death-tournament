const { XMLParser } = require('fast-xml-parser');

module.exports.default = function (source) {
    const options = this.getOptions();
    const parser = new XMLParser({
        ignoreAttributes: false,
        allowBooleanAttributes: true,
        attributeNamePrefix: '',
    });
    const jObj = parser.parse(source);

    const viewBox = jObj.svg.viewBox.split(' ').map(x => parseFloat(x));
    const parseCoordinates = v => v.split(',').map(x => parseFloat(x));
    const toAbsolute = ([x, y]) => [x, viewBox[3] - y];

    const convertPathD = path => {
        const v = path.d.split(' ');
        const vertices = [];
        let state = 'start';
        let penPosition = [0, viewBox[3]];
        const parseAbsoluteCoordinates = v => toAbsolute(parseCoordinates(v));
        const parseRelativeCoordinates = v => {
            const [x, y] = parseCoordinates(v);
            return [penPosition[0] + x, penPosition[1] - y];
        };

        const isPairOfCooridnates = v => /^(-?[0-9]+(\.[0-9]+)?(,|$)){2}/.test(v);

        for (let i = 0; i < v.length; ) {
            switch (state) {
                case 'start':
                    switch (v[i]) {
                        case 'M':
                            state = 'after_M';
                            break;
                        case 'm':
                            state = 'after_m';
                            break;
                        case 'L':
                            state = 'after_L';
                            break;
                        case 'l':
                            state = 'after_l';
                            break;
                        case 'z':
                        case 'Z':
                            state = 'end';
                            break;
                        default:
                            throw new Error(`Unrecognized path ${path.id}. Not sure what to do with ${v[i]}.`);
                    }

                    i++;
                    break;

                case 'end':
                    throw new Error(`Unrecognized path ${path.id}. Expected end of string but found ${v[i]}.`);

                case 'after_M': {
                    if (!isPairOfCooridnates(v[i])) {
                        state = 'start';
                        break;
                    }

                    const coords = parseAbsoluteCoordinates(v[i]);
                    vertices.push(coords);
                    penPosition = coords;
                    i++;
                    break;
                }

                case 'after_m': {
                    if (!isPairOfCooridnates(v[i])) {
                        state = 'start';
                        break;
                    }

                    const coords = parseRelativeCoordinates(v[i]);
                    vertices.push(coords);
                    penPosition = coords;
                    i++;
                    break;
                }

                case 'after_L': {
                    if (!isPairOfCooridnates(v[i])) {
                        state = 'start';
                        break;
                    }

                    const coords = parseAbsoluteCoordinates(v[i]);
                    vertices.push(coords);
                    penPosition = coords;
                    i++;
                    break;
                }

                case 'after_l': {
                    if (!isPairOfCooridnates(v[i])) {
                        state = 'start';
                        break;
                    }

                    const coords = parseRelativeCoordinates(v[i]);
                    vertices.push(coords);
                    penPosition = coords;
                    i++;
                    break;
                }
            }
        }

        return buildPathDefinition(path, vertices);
    };

    const convertRect = rect => {
        let x = parseFloat(rect.x);
        let y = parseFloat(rect.y);
        let width = parseFloat(rect.width);
        let height = parseFloat(rect.height);
        const vertices = [toAbsolute([x, y]), toAbsolute([x + width, y]), toAbsolute([x + width, y + height]), toAbsolute([x, y + height])];

        return buildPathDefinition(rect, vertices);
    };

    const paths = [...getNodes(jObj.svg.g?.path).map(p => convertPathD(p)), ...getNodes(jObj.svg.g?.rect).map(p => convertRect(p))];
    const zIndex = new Map(paths.map((p, i) => [p.id, i]));
    const hierarchy = new Map();
    for (const path of paths) {
        const parent = path.meta.connectTo ?? '@root';
        if (!hierarchy.has(parent)) {
            hierarchy.set(parent, []);
        }

        hierarchy.get(parent).push(path);
    }

    const statements = [];
    let nextIndex = 0;
    const addTransformPath = id => {
        statements.push(`export const ${id}TransformPath = ${nextIndex++};`);
    };

    const polygons = [];
    const transformedHierarchy = [];

    const addPolygon = (path, origin) => {
        const relativeOrigin = translateVerticeToOrigin(path.transformOrigin, origin);
        const polygon = [translateVerticesToOrigin(path.vertices, path.transformOrigin), path.color];
        if (path.meta.connectTo) {
            polygon.push(relativeOrigin);
        } else {
            polygon.push([0, 0]);
        }

        const back = (hierarchy.get(path.id) || [])
            .map((p, i) => ({ p, i }))
            .filter(({ p, i }) => zIndex.get(p.id) < zIndex.get(path.id))
            .map(({ p, i }) => {
                return addPolygon(p, path.transformOrigin);
            });

        const index = nextIndex;
        polygons.push(polygon);
        addTransformPath(path.id);

        const front = (hierarchy.get(path.id) || [])
            .map((p, i) => ({ p, i }))
            .filter(({ p, i }) => zIndex.get(p.id) > zIndex.get(path.id))
            .map(({ p, i }) => {
                return addPolygon(p, path.transformOrigin);
            });

        return [index, back, front];
    };

    for (const polygon of hierarchy.get('@root') ?? []) {
        transformedHierarchy.push(addPolygon(polygon, [0, 0]));
    }

    const model = [polygons, transformedHierarchy];

    statements.push(
        `export const model = ${JSON.stringify(
            model,
            function (key, value) {
                if (typeof value === 'number') {
                    return parseFloat(value.toFixed(2));
                }

                return value;
            },
            4
        )};`
    );

    return statements.join('\n\n');
};

const getNodes = nodes => {
    if (!nodes) {
        return [];
    }

    return Array.isArray(nodes) ? nodes : [nodes];
};

const translateVerticeToOrigin = (vertice, origin) => {
    return vertice.map((c, i) => c - origin[i]);
};

const translateVerticesToOrigin = (vertices, origin) => {
    return vertices.map(v => translateVerticeToOrigin(v, origin));
};

const buildPathDefinition = (svgNode, vertices) => {
    return {
        id: isValidIdentifier(svgNode.id) ? svgNode.id : `random${Math.floor(Math.random() * 1000000)}`,
        meta: JSON.parse(svgNode.desc?.['#text'] ?? '{}'),
        vertices,
        color: parseFillColor(svgNode.style),
        transformOrigin: computeTransformOrigin(vertices, extractInkscapeTransformCenter(svgNode)),
    };
};

const isValidIdentifier = id => /^[a-z0-9_]+$/i.test(id);

const extractInkscapeTransformCenter = path => {
    if (path['inkscape:transform-center-x'] === undefined || path['inkscape:transform-center-y'] === undefined) {
        return undefined;
    }

    return [parseFloat(path['inkscape:transform-center-x']), parseFloat(path['inkscape:transform-center-y'])];
};

const parseFillColor = style => {
    const regex = /fill:([^;]+);/;
    const match = style.match(regex);
    if (match) {
        const hex = match[1];
        const rgb = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if (rgb) {
            return [parseInt(rgb[1], 16) / 255, parseInt(rgb[2], 16) / 255, parseInt(rgb[3], 16) / 255];
        }
    }

    return [Math.random(), Math.random(), Math.random()];
};

const computeTransformOrigin = (vertices, inkscapeTransformCenter) => {
    const [minX, minY, maxX, maxY] = computeBoundingBox(vertices);
    const dx = (maxX - minX) / 2;
    const dy = (maxY - minY) / 2;

    if (!inkscapeTransformCenter) {
        return [dx, dy];
    }

    return [minX + dx + inkscapeTransformCenter[0], minY + dy + inkscapeTransformCenter[1]];
};

const computeBoundingBox = vertices => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const v of vertices) {
        minX = Math.min(minX, v[0]);
        minY = Math.min(minY, v[1]);
        maxX = Math.max(maxX, v[0]);
        maxY = Math.max(maxY, v[1]);
    }
    return [minX, minY, maxX, maxY];
};

const expected = [
    [
        [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
        ], // vertices
        [
            [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 0],
                [0, 0],
            ], // vertices
            [], // subpolygons,
            [], // transform origin (optional)
        ], // subpolygons
    ],
];
