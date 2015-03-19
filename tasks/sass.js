module.exports = function(grunt){
  grunt.config('sass', {

    dist: {
      options: {
        style: 'compressed'
      },
      files: {
        'assets/css/main.css': 'assets/sass/main.sass'
      }
    },

    dev: {
      options: {
        style: 'expanded'
      },
      files: {
        'assets/css/main.css': 'assets/sass/main.sass'
      }
    }

  });
};
