module.exports = function(grunt){
  grunt.config('shell', {

    jekyll_serve: {
      command: "jekyll serve",
      options: {
        stderr: false
      }
    },

    jekyll_build: {
      command: "jekyll build",
      options: {
        stderr: false
      }
    }

  });
};
