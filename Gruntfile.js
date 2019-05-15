/* jshint node:true */
module.exports = function(grunt){
  var pkg = grunt.file.readJSON('package.json'), deps = pkg.devDependencies;
  for(var plugin in deps){ if(plugin.match(/^grunt\-/)){ grunt.loadNpmTasks(plugin);}}
  
  grunt.initConfig({
    clean: ['dist/*', 'pzpr-canvas-*.tgz', '*.svg'],
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
};

