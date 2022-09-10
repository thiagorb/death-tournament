const fs = require('fs');
const path = require('path');
const svgLoader = require('./tools/svg-loader.js').default;
const glslLoader = require('./tools/glsl-loader.js').default;

const testSvg2js = () => {
    console.log(
        svgLoader.call(
            {
                getOptions: () => ({}),
                resourcePath: '',
            },
            fs.readFileSync(path.join(__dirname, 'art/death.svg'))
        )
    );
};

const glslLoaderTest = async () => {
    const vai = srcPath =>
        glslLoader.call(
            {
                getOptions: () => ({}),
                resourcePath: srcPath,
            },
            fs.readFileSync(srcPath)
        );

    console.log(await vai(path.join(__dirname, 'src/shaders/fragment.frag')));
    console.log(await vai(path.join(__dirname, 'src/shaders/vertex.vert')));
};

testSvg2js();
