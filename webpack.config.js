const webpack = require('webpack');
const path = require('path');

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
    }

};