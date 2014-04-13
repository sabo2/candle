
module.exports = function(grunt){
  var pkg = grunt.file.readJSON('package.json'), deps = pkg.devDependencies;
  for(var plugin in deps){ if(plugin.match(/^grunt\-/)){ grunt.loadNpmTasks(plugin);}}
  
  var fs = require('fs');
  var banner_min  = fs.readFileSync('./src/common/banner_min.js',  'utf-8');
  var banner_full = fs.readFileSync('./src/common/banner_full.js', 'utf-8');
  
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: ["dist/*", 'candle-*.zip', 'candle-*.tar.gz'],

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
    },

    shell: {
      release: {
        command: [
          "tar cvzf candle-<%= pkg.version %>.tar.gz --exclude *.concat.js dist/*",
          "zip -9r candle-<%= pkg.version %>.zip dist/* -x *.concat.js"
        ].join('; ')
      }
    }
  });
  
  grunt.registerTask('default', ['clean', 'copy:debug']);
  grunt.registerTask('release', ['clean', 'concat', 'uglify']);
  grunt.registerTask('zipfile', ['shell:release']);
};

