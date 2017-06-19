const webpack = require('webpack');
const path = require('path');
// const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: path.join(__dirname,"/src/app"),
    output: {
        path: __dirname+'/dist',
        filename: "build.js"
    },
    module: {

        loaders: [
            { test: /\.js$/,
              exclude: /node_modules/,
              include: [path.resolve(__dirname, 'src')],
              loader: "babel-loader",
              query: {
                presets: ['es2015','react','stage-0']
              }
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: false,
            mangle: true,
            minimize: true,
            compress: { warnings: false }
        })
    ]
};