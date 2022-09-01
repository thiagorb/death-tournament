const fs = require('fs');
const path = require('path');
const loader = require('./tools/svg2ts.js').default;

console.log(
    loader.call(
        {
            getOptions: () => ({}),
            resourcePath: '',
        },
        fs.readFileSync(path.join(__dirname, 'art/death.svg'))
    )
);
