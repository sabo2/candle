/* jshint node:true */
module.exports = function(grunt){
  var pkg = grunt.file.readJSON('package.json'), deps = pkg.devDependencies;
  for(var plugin in deps){ if(plugin.match(/^grunt\-/)){ grunt.loadNpmTasks(plugin);}}
  
  var fs = require('fs');
  var banner_min  = fs.readFileSync('./src/common/banner_min.js',  'utf-8');
  var banner_full = fs.readFileSync('./src/common/banner_full.js', 'utf-8');
  
  grunt.initConfig({
    pkg: pkg,

    clean: ['dist/*', 'candle-*.tar.gz'],

    concat: {
      options: {
        banner: banner_full,
        process: true
      },
      candle: {
        files: [
          { src: require('./src/candle.js').files, dest: 'dist/candle.concat.js' }
        ]
      }
    },

    copy: {
      options: {
        process: function(content, srcpath){ return grunt.template.process(content);}
      },
      debug: {
        files: [
          { expand: true, cwd: "src", src: ["**/*.js"], dest: "dist" }
        ]
      }
    },

    uglify: {
      options: {
        banner: banner_min,
        report: 'min'
      },
      candle: {
        files: [
          { src: 'dist/candle.concat.js', dest: 'dist/candle.js' }
        ]
      }
    },

    shell: {
      release: {
        command: [
          "cd dist",
          "tar cvzf candle-<%= pkg.version %>.tar.gz --exclude \".DS_Store\" *",
          "mv candle-<%= pkg.version %>.* ..",
          "cd .."
        ].join('; ')
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
  
  grunt.registerTask('default', ['clean', 'copy:debug']);
  grunt.registerTask('release', ['clean', 'concat', 'uglify']);
  grunt.registerTask('zipfile', ['shell:release']);
};

