var path = require("path");

module.exports = {
  mode: "production",
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
  resolve: {
    extensions: [".ts"]
  }
};
