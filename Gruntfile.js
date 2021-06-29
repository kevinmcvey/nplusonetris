module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      files: ['./src/**/*.js'],
      tasks: ['browserify', 'uglify'],
    },


    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: './dist/build.js',
        dest: './dist/build.min.js'
      }
    },
    browserify: {
      dist: {
        src: ['./src/**/*.js'],
        dest: './dist/build.js',
        options: {
          transform: [['babelify', {presets: ['es2015']}]],
        },
      }
    },
  });

  // Load the plugin that provides grunt watch
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Load the plugin that provides the "browserify" task.
  grunt.loadNpmTasks('grunt-browserify');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'uglify']);
};