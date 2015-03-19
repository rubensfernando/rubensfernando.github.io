module.exports = function(grunt){
  grunt.registerTask('build', [
    'sass:dist',
    'shell:jekyll_build'
  ]);
};
