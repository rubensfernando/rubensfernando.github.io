import gulp         from 'gulp';
import gutil        from 'gulp-util';

// var autoprefixer = require('gulp-autoprefixer');
import bs           from 'browser-sync'
import concat       from 'gulp-concat';
import del          from 'del';
import jshint       from 'gulp-jshint';
import minifycss    from 'gulp-minify-css';
import notify       from 'gulp-notify';
import rename       from 'gulp-rename';
import responsive   from 'gulp-responsive';     // requires sharp and vips (brew)
import run          from 'gulp-run';
import runSequence  from 'run-sequence';
import size         from 'gulp-size';
import uglify       from 'gulp-uglify';
import imagmin      from 'gulp-imagemin';
import cssnano      from 'gulp-cssnano';
import postcss      from 'gulp-postcss';
import stylus       from 'gulp-stylus';
import lost         from 'lost';
import pxtorem      from 'postcss-pxtorem';
import autoprefixer from 'autoprefixer';
import rupture      from 'rupture';
import mqpacker     from 'css-mqpacker';
import sourcemaps   from 'gulp-sourcemaps';
import flexibility  from 'postcss-flexibility';

import config       from './app/gulp/config';
import paths        from './app/gulp/paths';

const browserSync = bs.create();

// Uses Sass compiler to process styles, adds vendor prefixes, minifies,
// and then outputs file to appropriate location(s)
gulp.task('build:styles', function() {
  const configStyle = {
    'include css': true,
    'use': [rupture()],
    define: {}
  };
  return gulp.src(paths.appSassFiles + '**/*.styl')
    .pipe(sourcemaps.init())
    .pipe(stylus(configStyle))
    .pipe(postcss([
      lost(),
      pxtorem(),
      // mqpacker(),
      // autoprefixer({
      //   browsers: [
      //    'last 2 versions',
      //    'Android >= 4',
      //    'IE >= 8'
      //   ]
      // }),
      // flexibility(),
      // cssnano({ zindex: false })
    ]))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.jekyllDir))
    .pipe(gulp.dest(paths.siteDir))
    .on('error', gutil.log);
});

gulp.task('clean:styles', function(cb) {
  del([paths.jekyllDir + 'main.css', paths.siteDir + 'main.css'], cb);
});

// Concatenates and uglifies JS files and outputs result to
// the appropriate location(s).
gulp.task('build:scripts', function() {
  return gulp.src(paths.appJsFilesGlob)
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.jekyllDir))
    .pipe(gulp.dest(paths.siteDir))
    .on('error', gutil.log);
});

gulp.task('clean:scripts', function(cb) {
  del([paths.jekyllDir + 'main.js', paths.siteDir + 'main.js'], cb);
});

// Creates optimized versions of files with different qualities, sizes, and
// formats, then outputs to appropriate location(s)
gulp.task('build:images', function() {
  return gulp.src(paths.appImageFilesGlob)
    .pipe(imagmin())
    .pipe(gulp.dest(paths.jekyllImageFiles))
    .pipe(gulp.dest(paths.siteImageFiles))
    .pipe(browserSync.stream())
    .pipe(size({showFiles: true}))
    .on('error', gutil.log);
});

gulp.task('clean:images', () => {
  del(paths.jekyllImageFiles);
  del( paths.siteImageFiles);
});

// Places all fonts in appropriate location(s)
// gulp.task('build:fonts', ['fontello:fonts']);

gulp.task('clean:fonts', function(cb) {
  del([paths.jekyllFontFiles, paths.siteFontFiles], cb);
});

// Runs Jekyll build
gulp.task('build:jekyll', function() {
  var shellCommand = 'bundle exec jekyll build --config _config.yml';
  if (config.drafts) { shellCommand += ' --drafts'; };

  return gulp.src(paths.jekyllDir)
    .pipe(run(shellCommand))
    .on('error', gutil.log);
});

// Only deletes what's in the site folder
gulp.task('clean:jekyll', () => del(paths.siteDir));

// gulp.task('clean', gulp.series('clean:jekyll','clean:images','clean:scripts','clean:styles'));
gulp.task('clean', gulp.series('clean:jekyll'));

// Builds site
// Optionally pass the --drafts flag to enable including drafts
gulp.task('build',
  gulp.series(
              gulp.parallel('build:scripts', 'build:images', 'build:styles'),
              'build:jekyll'));

// Default Task: builds site
gulp.task('default', gulp.series('build'));

// Special tasks for building and then reloading BrowserSync
gulp.task('build:jekyll:watch', gulp.series('build:jekyll', function(cb) {
  browserSync.reload();
  cb();
}));

gulp.task('build:scripts:watch', gulp.series('build:scripts', function(cb) {
  browserSync.reload();
  cb();
}));

// Static Server + watching files
// WARNING: passing anything besides hard-coded literal paths with globs doesn't
//          seem to work with the gulp.watch()
gulp.task('serve', gulp.series('build', function() {

  browserSync.init({
    server: paths.siteDir,
    ghostMode: true, // do not mirror clicks, reloads, etc. (performance)
    logFileChanges: true,
    logLevel: 'debug',
    open: false       // do not open the browser
  });

  // Watch site settings
  gulp.watch(['_config.yml', 'app/localhost_config.yml'], gulp.series('build:jekyll:watch'));

  // Watch app .styl files, changes are piped to browserSync
  gulp.watch('app/styles/**/*.styl', gulp.series('build:styles'));

  // Watch app .js files
  gulp.watch('app/scripts/**/*.js', gulp.series('build:scripts:watch'));

  // Watch Jekyll posts
  gulp.watch('_posts/**/*.+(md|markdown|MD)', gulp.series('build:jekyll:watch'));

  // Watch Jekyll drafts if --drafts flag was passed
  if (config.drafts) {
    gulp.watch('_drafts/*.+(md|markdown|MD)', gulp.series('build:jekyll:watch'));
  }

  // Watch Jekyll html files
  gulp.watch(["**/*.+(md|markdown|MD|html)", "!_site/**/*.*"], gulp.series("build:jekyll:watch"));

  // Watch Jekyll RSS feed XML file
  gulp.watch('feed.xml', gulp.series('build:jekyll:watch'));

  // Watch Jekyll data files
  gulp.watch('_data/**.*+(yml|yaml|csv|json)', gulp.series('build:jekyll:watch'));

  // Watch Jekyll favicon.ico
  gulp.watch('favicon.ico', gulp.series('build:jekyll:watch'));
}));

// Updates Bower packages
gulp.task('update:bower', function() {
  return gulp.src('')
    .pipe(run('bower install'))
    .pipe(run('bower prune'))
    .pipe(run('bower update'))
    .pipe(notify({ message: 'Bower Update Complete' }))
    .on('error', gutil.log);
});

// Updates Ruby gems
gulp.task('update:bundle', function() {
  return gulp.src('')
    .pipe(run('bundle install'))
    .pipe(run('bundle update'))
    .pipe(notify({ message: 'Bundle Update Complete' }))
    .on('error', gutil.log);
});

// Copies the normalize.css bower package to proper directory and renames it
// so that Sass can include it as a partial
gulp.task('normalize-css', function() {
  return gulp.src(paths.bowerComponentsDir + 'normalize.css/normalize.css')
    .pipe(rename('_reset.scss'))
    .pipe(gulp.dest(paths.appSassFiles + '/base'))
    .on('error', gutil.log);
});

// Places Fontello CSS files in proper location
gulp.task('fontello:css', function() {
  return gulp.src(paths.appVendorFiles + '/fontello*/css/fontello.css')
    .pipe(rename('_fontello.scss')) // so can be imported as a Sass partial
    .pipe(gulp.dest(paths.appSassFiles + '/base'))
    .on('error', gutil.log);
});

// Places Fontello fonts in proper location
gulp.task('fontello:fonts', function() {
  return gulp.src(paths.appVendorFiles + '/fontello*/font/**.*')
    .pipe(rename(function(path) {path.dirname = '';}))
    .pipe(gulp.dest(paths.jekyllFontFiles))
    .pipe(gulp.dest(paths.siteFontFiles))
    .pipe(browserSync.stream())
    .on('error', gutil.log);
});

// Places files downloaded from Fontello font generator website into proper
// locations
// Note: make sure to delete old Fontello folder before running this so
// that only the newly downloaded folder matches the glob
// gulp.task('fontello', ['fontello:css', 'fontello:fonts']);

// Updates Bower packages and Ruby gems, runs post-update operations, and re-builds
gulp.task('update', gulp.series('update:bower', 'update:bundle', function(cb) {
  runSequence('normalize-css', 'build', cb);
}));
