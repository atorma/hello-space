'use strict';

const path = require('path');

module.exports = {
  entry: './src/go_to_moon.ts',
  output: {
    filename: 'go_to_moon.js',
    path: path.join(__dirname, 'dist'),
    library: "GoToMoon",
    libraryTarget: "var"
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader'
      },
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader'
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  externals: [
    (context, request, callback) => {
      if (/external\//.test(request) || /cannon/.test(request) ) {
        callback(null, '{PIDController: PIDController, AngularPIDController: AngularPIDController, Controls: Controls, Vec3: Vec3, Quaternion: Quaternion}');
      } else {
        callback();
      }
    }
  ]
};