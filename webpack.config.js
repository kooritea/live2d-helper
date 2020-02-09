var path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/main.ts",
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
  devtool: "inline-source-map",
  resolve: {
    extensions: [".ts"]
  },
  node: {
    fs: 'empty'
  },
  performance: {
    hints: false
  }
};
