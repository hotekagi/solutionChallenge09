const path = require('path')

module.exports = {
  mode: 'development',
  entry: {
    talk: './src/talk.js',
    view: './src/view.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: path.join(__dirname, 'dist'),
    port: 8081,
    // livekit-server, server.jsを先に起動しておく
  },
}
