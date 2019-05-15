const webpack = require("webpack");

const getConfig = isModule => ({
  mode: 'development',
  entry: ['./src/candle.core.js'],
//entry: (isModule ? ['./src/candle.js'] : ['@babel/polyfill', './src/candle.js']),
  target: 'node',
  output: (!isModule ? {
    filename: 'candle.js',
    library : "Candle",
    libraryTarget : 'umd',
    libraryExport : 'default',
    globalObject  : "this"
  } : {
    filename: 'candle.module.js',
    library : "Candle",
    libraryTarget : 'var',
    libraryExport : 'default'
  }),
  externals : [{canvas: true}],
  module: {
    rules: [
    {
      test: /\.js/,
      exclude: /node_modules/,
      use: [
      {
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {
              targets: (!isModule ? {
                ie: "11",
                safari: "8",
                ios: "8",
                chrome: "49",
                firefox: "45",
                node: "10.9"
              } : {esmodules:true}),
              modules: false,
              //useBuiltIns: 'usage'
            }]
          ]
        }
      }]
    }]
  },
  plugins : [
    new webpack.BannerPlugin({
      banner: require('fs').readFileSync('./src/common/banner_min.js', 'utf8')
                           .replace('<%= pkg.version %>', require("./package.json").version)
                           .replace('<%= grunt.template.today(\'yyyy\') %>', (new Date()).getFullYear())
                           .replace('<%= pkg.author %>', require("./package.json").author),
      raw: true
    }),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(require("./package.json").version)
    })
  ]
});

const MyModuleExportPlugin = class MyModuleExportPlugin {
  apply(compiler){
    compiler.hooks.emit.tap('MyModuleExportPlugin', complication => {
      let rawSource = complication.assets[complication.outputOptions.filename];
      const exportDirective = `export default ${complication.outputOptions.library};`;
      if(!!rawSource._source){ // mode=development
        rawSource._source.children.push(exportDirective);
      }
      else if(!!rawSource.children){ // mode=development & BannerPlugin
        rawSource.children[2]._source.children.push(exportDirective);
      }
      else if(!!rawSource._value){ // mode=production
        rawSource._value += exportDirective;
      }
    });
  }
};

let [config_es5, config_module] = [getConfig(false), getConfig(true)];

config_module.plugins.push(new MyModuleExportPlugin());

module.exports = [config_es5, config_module];
