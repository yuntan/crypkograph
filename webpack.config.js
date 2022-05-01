const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  experiments: {
    topLevelAwait: true,
  },
  entry: {
    background: path.resolve(__dirname, 'src/background.js'),
    index: path.resolve(__dirname, 'src/index.js'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        'manifest.json',
        'index.html',
        '_locales/**',
        'icons/*.png',
      ],
    }),
    new ZipWebpackPlugin({
      path: __dirname,
      filename: 'ext.zip',
    }),
  ],
};
