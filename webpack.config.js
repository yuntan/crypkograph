const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'src/background.js'),
  output: {
    filename: 'background.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        'manifest.json',
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
