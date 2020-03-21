const path = require("path");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
module.exports = {
  mode: "production",
  entry: "./src/main.ts",
  optimization: {
    minimizer: [
      new UglifyJSPlugin({
        uglifyOptions: {
          ecma: 6,
          keep_fnames: true,
          keep_classnames: true
        }
      })
    ]
  },
  output: {
    filename: "index.js",
    path: path.join(__dirname, "./dist"),
    libraryExport: "default",
    library: "Live2dHelper",
    libraryTarget: "umd"
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader"
      }
    ]
  },
  resolve: {
    extensions: [".ts"]
  },
  node: {
    fs: "empty"
  },
  performance: {
    hints: false
  }
};
