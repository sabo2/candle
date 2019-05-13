/* jshint node:true */
module.exports = function(grunt){
  var pkg = grunt.file.readJSON('package.json'), deps = pkg.devDependencies;
  for(var plugin in deps){ if(plugin.match(/^grunt\-/)){ grunt.loadNpmTasks(plugin);}}
  
  var fs = require('fs');
  var banner_min  = fs.readFileSync('./src/common/banner_min.js',  'utf-8');
  var banner_full = fs.readFileSync('./src/common/banner_full.js', 'utf-8');
  
  grunt.initConfig({
    pkg: pkg,

    clean: ['dist/*', 'pzpr-canvas-*.tgz', '*.svg'],

    copy: {
      license: {
        files : [
          { src: 'LICENSE.txt', dest: 'dist/LICENSE.txt'}
        ]
      }
    },

    concat: {
      options: {
        banner: banner_full,
        process: true
      },
      candle: {
        options: {
          sourceMap: true
        },
        files: [
          { src: require('./src/candle.js').files, dest: 'dist/candle.concat.js' }
        ]
      },
      'candle-rel': {
        files: [
          { src: require('./src/candle.js').files, dest: 'dist/candle.concat.js' }
        ]
      }
    },

    uglify: {
      options: {
        banner: banner_min,
        report: 'min'
      },
      candle: {
        options: {
          sourceMap : 'dist/candle.js.map',
          sourceMapIn : 'dist/candle.concat.js.map',
          sourceMapIncludeSources : true
        },
        files: [
          { src: 'dist/candle.concat.js', dest: 'dist/candle.js' }
        ]
      },
      'candle-rel': {
        files: [
          { src: 'dist/candle.concat.js', dest: 'dist/candle.js' }
        ]
      }
    },

    jshint: {
      options: {
        jshintrc: true
      },
      all: {
        src: [
          'Gruntfile.js',
          'src/*.js'
        ]
      }
    }
  });
  
  grunt.registerTask('default', ['newer:jshint',                          'concat:candle',     'uglify:candle']);
  grunt.registerTask('release', ['newer:jshint', 'clean', 'copy:license', 'concat:candle-rel', 'uglify:candle-rel']);
};

