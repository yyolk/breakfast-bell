// webpack.config.js

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const ArchivePlugin = require("webpack-archive-plugin");
const S3Plugin = require("webpack-s3-plugin");

function getPlugins() {
  let plugins = [];
  plugins.push(new
    ArchivePlugin({
      output: 'breakfast-bell',
      format: 'zip'
    })
  );
  plugins.push(new
    S3Plugin({
      include: /.*\.zip/,
      s3UploadOptions: {
        Bucket: 'yolks-breakfasthouse-lambda'
      },
      directory: __dirname,
    })
  );
  if (process.env.NODE_ENV === 'production') {
    plugins.push(new
      webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false,
        }
      })
    );
  }
  return plugins;
}

module.exports = {
  output: {
    path: path.join(__dirname, "dist"),
    library: "[name]",
    libraryTarget: "commonjs2",
    filename: "[name].js"
  },
  entry: "./index.js",
  target: "node",
  externals: [
    "aws-sdk"
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          plugins: [
            'syntax-flow',
            'transform-flow-strip-types'
          ]
        }
      },
      {
        test: /\.json$/,
        loader: 'json'
      }
    ],
    noParse: [/aws-sdk/]
  },
  plugins: getPlugins()
};