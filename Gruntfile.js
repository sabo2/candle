var component = ['core', 'base', 'svg', 'canvas', 'vml'];
var banner_min = [
  "/*! @license candle.js v<%= pkg.version %>"+
  " (c) 2011-<%= grunt.template.today('yyyy') %> <%= pkg.author %>, MIT license",
  " *   https://bitbucket.org/sabo2/candle */",
  ""
].join("\n");
var banner_full = [
  "/*!",
  " * @license",
  " * ",
  " * candle.js v<%= pkg.version %>",
  " *  https://bitbucket.org/sabo2/candle",
  " * ",
  " * This script is referencing following library.",
  " *  uuCanvas.js (version 1.0)",
  " *  http://code.google.com/p/uupaa-js-spinoff/",
  " * ",
  " * Copyright 2011-<%= grunt.template.today('yyyy') %> <%= pkg.author %>",
  " * ",
  " * This script is released under the MIT license. Please see below.",
  " *  http://www.opensource.org/licenses/mit-license.php",
  " * ",
  " * Date: <%= grunt.template.today('yyyy-mm-dd') %>",
  " */",
  "",
  ""
 ].join("\n")

module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: ["dist/*"],

    concat: {
      options: {
        banner: banner_full
      },
      candle: {
        files: [
          { src: [], dest: 'dist/candle.concat.js' }
        ]
      }
    },

    copy: {
      debug: {
        files: [
          { expand: true, cwd: "src", src: ["*.js"], dest: "dist" }
        ]
      }
    },

    replace: {
      debug: {
        src: 'dist/candle.core.js',
        overwrite: true,
        replacements: [
          { from: "<deploy-version>", to: "<%= pkg.version %>"}
        ]
      },
      candle: {
        src: 'dist/candle.concat.js',
        overwrite: true,
        replacements: [
          { from: "<deploy-version>", to: "<%= pkg.version %>"}
        ]
      }
    },

    uglify: {
      options: {
        banner: banner_min,
        report: 'min',
      },
      candle: {
        files: [
          { src: 'dist/candle.concat.js', dest: 'dist/candle.js' }
        ]
      }
    }
  });
  
  function mod2file(mod){
    return "src/candle." + mod + ".js";
  }
  function wrap(array){
    array.unshift("src/intro.js");
    array.push   ("src/outro.js");
    return array;
  }
  
  var prop = "concat.candle.files.0.src";
  grunt.config.set(prop, wrap(component.map(mod2file)));
  
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-text-replace');
  
  grunt.registerTask('default', ['clean', 'copy:debug', 'replace:debug']);
  grunt.registerTask('release', ['clean', 'concat', 'replace:candle', 'uglify']);
};

