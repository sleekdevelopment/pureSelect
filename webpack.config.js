const path = require('path');
// const webpack = require('webpack');

module.exports = {
    entry: './',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        filename: 'pureSelect.min.js',
        path: path.resolve(__dirname, 'dist')
    }
};