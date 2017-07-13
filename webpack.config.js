const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background',
    options: './src/options',
    tongwen: './src/tongwen'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: './src/LICENSE' },
      { from: './src/manifest.json' },
      { from: './src/options.css' },
      { from: './src/options.html' },
      { from: './src/README.md' },
      { from: './src/_locales', to: '_locales' },
      { from: './src/icon', to: 'icon' },
      { from: './src/lib/tongwen', to: 'lib/tongwen' }
    ])
  ]
};
