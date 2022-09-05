const { spglslAngleCompile } = require('spglsl');

let nextIdentifier = 'a'.charCodeAt(0);

/**
 * @type {Map<string, {sources: Set<string>, renamed: string}}
 */
const usages = new Map([['vColor', { sources: new Set(['nope']), renamed: 'a' }]]);
/**
 * @type {Map<string, string}
 */
const usedIdentifiers = new Map([['a', 'vColor']]);

const removeUsages = (sourcePath, firstPass) => {
    const newKeys = new Set([...Object.keys(firstPass.globals), ...Object.keys(firstPass.uniforms)]);
    for (const key of usages.keys()) {
        const keyUsages = usages.get(key);
        if (!newKeys.has(key) && keyUsages.sources.has(sourcePath)) {
            keyUsages.sources.delete(sourcePath);
            if (keyUsages.sources.size === 0) {
                usages.delete(key);
                usedIdentifiers.delete(keyUsages.renamed);
            }
        }
    }
};

const reassign = (sourcePath, firstPass) => {
    for (const key of [...Object.keys(firstPass.globals), ...Object.keys(firstPass.uniforms)]) {
        if (!usages.has(key)) {
            const renamed = findIdentifier();
            usedIdentifiers.set(renamed, key);
            usages.set(key, { sources: new Set(), renamed });
        }

        const keyUsages = usages.get(key);
        keyUsages.sources.add(sourcePath);
    }
};

const getNextIdentifier = () => {
    const identifier = nextIdentifier;

    if (nextIdentifier === 'z'.charCodeAt(0)) {
        nextIdentifier = 'a'.charCodeAt(0);
    } else {
        nextIdentifier++;
    }

    return identifier;
};

const findIdentifier = () => {
    const startValue = nextIdentifier;

    while (true) {
        const identifier = String.fromCharCode(getNextIdentifier());
        if (!usedIdentifiers.has(identifier)) {
            return identifier;
        }

        if (nextIdentifier === startValue) {
            throw new Error('Unable to find free identifier');
        }
    }
};

module.exports.default = async function (source) {
    const firstPass = await compile(source, this.resourcePath, {});
    removeUsages(this.resourcePath, firstPass);
    reassign(this.resourcePath, firstPass);

    const rename = {};
    for (const k of usedIdentifiers.keys()) {
        rename[usedIdentifiers.get(k)] = k;
    }

    const statements = [];
    for (const key of Object.keys(rename)) {
        statements.push(`export const ${key}Renamed = ${JSON.stringify(rename[key])}`);
    }
    const result = await compile(source, this.resourcePath, rename);

    statements.push(`export const source = ${JSON.stringify(result.output)};`);

    return statements.join('\n');
};

const compile = async (source, sourcePath, mangle_global_map) => {
    const result = await spglslAngleCompile({
        mainFilePath: sourcePath,
        mainSourceCode: source.toString(),
        minify: true,
        mangle: true,
        compileMode: 'Optimize',
        mangle_global_map,
    });

    if (!result.valid) {
        console.error(result.infoLog);
        throw new Error('GLSL compilation failed');
    }

    return result;
};
