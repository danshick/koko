var gulp = require('gulp');
var typescript = require('gulp-tsc');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var less = require('gulp-less');
var rename = require('gulp-rename');
var clean = require('gulp-clean');
var runElectron = require('gulp-run-electron');
var install = require('gulp-install');
var gulpAsar = require('gulp-asar');
/*var download = require('gulp-download');*/

gulp.task('default', ['run']);

/*gulp.task('build-win', ['asar'], function(){
  download('')
    .pipe(gulp.dest("downloads/"));
});*/

gulp.task('asar', ['npm-asar'], function(){
  return gulp.src('asar/**/*', {base: 'asar'})
    .pipe(gulpAsar('app.asar'))
    .pipe(gulp.dest('build'));
});

gulp.task('npm-asar', ['copy-asar'], function(){
  return gulp.src('asar/package.json')
    .pipe(gulp.dest('asar'))
    .pipe(install({production: true}));
});

gulp.task('copy-asar', ['build'], function(){
  return gulp.src(['config/**', 
            'build/**',
            'resource/**',
            'main.js',
            'index.html',
            'package.json'], { "base" : "." })
      .pipe(gulp.dest('asar'));
});

gulp.task('run', ['build'], function(){
  return gulp.src('.')
              .pipe(runElectron());
});

gulp.task('build', ['clean',
                    'config', 
                    'renderer_scripts',
                    'renderer_browserify',
                    'browser_scripts',
                    'style_less']);

gulp.task('clean', function () {
  gulp.src('asar', {read: false})
        .pipe(clean());
  gulp.src('dist', {read: false})
        .pipe(clean());
  return gulp.src('build', {read: false})
        .pipe(clean());
});

gulp.task('config', ['clean'], function(){
  return gulp.src('config/**/*')
        .pipe(gulp.dest('build/config'));
});

gulp.task('renderer_scripts', function() {
  return gulp.src('renderer/*.ts')
      .pipe(typescript({
        module: 'commonjs',
        removeComments: true,
        preserveConstEnums: true,
        sourceMap: true,
        target: 'ES5'
      }))
      .pipe(gulp.dest('build/renderer'));
});

gulp.task('renderer_browserify', ['renderer_scripts'], function () {
  var b = browserify('./build/renderer/app.js');
  b.ignore('ipc');
  var bundle = b.bundle();

  return bundle
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(rename('renderer.js'))
    .pipe(gulp.dest('build'));
});

gulp.task('browser_scripts', function() {
  return gulp.src('browser/*.ts')
      .pipe(typescript({
        module: 'commonjs',
        removeComments: true,
        preserveConstEnums: true,
        sourceMap: true,
        target: 'ES5'
      }))
      .pipe(gulp.dest('build/browser'));
});

gulp.task('style_less', function() {
   return gulp.src('style/main.less')
          .pipe(less())
          .pipe(rename('built.css'))
          .pipe(gulp.dest('build'));
});
