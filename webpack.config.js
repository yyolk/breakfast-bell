// webpack.config.js

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const ArchivePlugin = require("webpack-archive-plugin");
const S3Plugin = require("webpack-s3-plugin");

function getEntry() {
  return fs
    .readdirSync(path.join(__dirname, "./lambdas"))
    .filter(filename => /\.js$/.test(filename))
    .map(filename => {
      let entry = {};
      entry[filename.replace(".js", "")] = path.join(
        __dirname,
        "./lambdas/",
        filename
      );
      return entry;
    })
    .reduce((finalObject, entry) => Object.assign(finalObject, entry), {})
}


function getPlugins() {
  let plugins = [];
  process.env.UGLIFY_JS === 'true'
    || process.env.NODE_ENV === 'production'
    && plugins.push(new
      webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false,
        }
      })
    );

  if (process.env.NODE_ENV === 'production') {
    plugins.push(new
      ArchivePlugin({
        output: 'breakfast-bell',
        format: 'zip'
      })
    );
    plugins.push(new
      S3Plugin({
        include: /(.*\.zip|swagger.yaml)/,
        s3Options: {
          region: 'us-east-1'
        },
        s3UploadOptions: {
          Bucket: 'yolks-breakfasthouse-lambda'
        },
        directory: __dirname,
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
  // entry: getEntry(),
  target: "node",
  externals: ["aws-sdk"],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          plugins: [
            'transform-regenerator',
            'syntax-async-functions'
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
