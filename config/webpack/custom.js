const webpack = require('webpack')

const path = require('path')

module.exports = {
  plugins: [
      new webpack.ContextReplacementPlugin(
        // The (\\|\/) piece accounts for path separators in *nix and Windows
        /angular(\\|\/)core/,
        root('../../app/javascript/hello_angular'), // location of your src
        { }
      )
  ]
}
function root(__path) {
  return path.join(__dirname, __path);
}