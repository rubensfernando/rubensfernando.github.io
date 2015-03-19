module.exports = function(grunt){
  grunt.config('concurrent', {
    dev: {
      tasks: [
        'shell:jekyll_serve',
        'watch:styles'
      ],
      options: {
        logConcurrentOutput: true
      }
    }
  });
};
