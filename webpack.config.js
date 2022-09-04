const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/main.ts',
    output: {
        filename: 'main.js',
    },
    devServer: {
        hot: true,
        liveReload: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            template: './index.html',
            filename: 'index.html',
            minify: {
                collapseWhitespace: true,
                minifyCSS: true,
            },
        }),
    ],
    module: {
        rules: [
            {
                test: /\.(png|jpe?g|gif)$/i,
                loader: 'file-loader',
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.svg$/,
                use: [{ loader: path.resolve('tools/svg-loader.js') }],
            },
            {
                test: /\.(vert|frag)$/,
                use: [{ loader: path.resolve('tools/glsl-loader.js') }],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.png', '.glsl'],
    },
};
