const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background',
    options: './src/lib/options/options',
    tongwen: './src/lib/tongwen/tongwen',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: 'eslint-loader'
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new CopyWebpackPlugin([
      { from: './src/LICENSE' },
      { from: './src/manifest.json' },
      { from: './src/lib/options/options.css' },
      { from: './src/_locales', to: '_locales' },
      { from: './src/icon', to: 'icon' },
    ]),
    new HtmlWebpackPlugin({
      filename: 'options.html',
      template: 'src/lib/options/options.html',
      chunks: ['options'],
    }),
  ],
};
