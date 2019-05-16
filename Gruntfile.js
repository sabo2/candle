module.exports = function(grunt){
  var pkg = grunt.file.readJSON('package.json'), deps = pkg.devDependencies;
  for(var plugin in deps){ if(plugin.match(/^grunt\-/)){ grunt.loadNpmTasks(plugin);}}
  
  grunt.initConfig({
    clean: ['dist/*', 'pzpr-canvas-*.tgz', '*.svg']
  });
};

