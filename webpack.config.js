const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background',
    options: './src/options/options',
    tongwen: './src/lib/tongwen/tongwen',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: 'eslint-loader',
        options: {
          fix: true,
          emitError: true,
          emitWarning: true,
        },
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader'],
        exclude: /node-modules/,
      },
      {
        test: /\.svg$/,
        loaders: ['svg-url-loader'],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new CopyWebpackPlugin([
      { from: './src/LICENSE' },
      { from: './src/manifest.json' },
      { from: './src/_locales', to: '_locales' },
      { from: './src/icon', to: 'icon' },
    ]),
    new HtmlWebpackPlugin({
      filename: 'options.html',
      template: 'src/options/options.html',
      chunks: ['options'],
    }),
  ],
};
