const gulp = require('gulp');
const watch = require('gulp-watch');
const eslint = require('gulp-eslint');
const rollup = require('gulp-rollup');
const babel = require('gulp-babel');
const autoprefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const px2rem = require('gulp-px2rem');
const sourcemaps = require('gulp-sourcemaps');

function html() {
  return gulp.src('./src/**/*.html')
    .pipe(gulp.dest('./dist'));
}

function images() {
  return gulp.src('./src/images/**/*')
    .pipe(gulp.dest('./dist/images'));
}

function libjs() {
  return gulp.src('./src/javascripts/libs/**/*.js')
    .pipe(gulp.dest('./dist/javascripts/libs'));
}

function javascripts() {
  return gulp.src('./src/javascripts/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(sourcemaps.init())
    .pipe(rollup({
      entry: './src/javascripts/main.js',
      format: 'iife'
    }))
    .pipe(babel({
      presets: ['es2015', 'stage-2']
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/javascripts'));
}

function styles() {
  return gulp.src('./src/scss/main.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 4 versions', 'Android >= 4.4']
    }))
    .pipe(px2rem())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/styles'));
}

gulp.task('build:html', html);

gulp.task('build:images', images);

gulp.task('build:libjs', libjs);

gulp.task('build:javascripts', javascripts);

gulp.task('build:styles', styles);

gulp.task('build:start', ['build:html', 'build:images', 'build:libjs', 'build:javascripts', 'build:styles']);

gulp.task('watch', ['build:start'], () => {
  // move html files
  watch('./src/**/*.html', html);

  // move lib js files
  watch('./src/javascripts/libs/**/*.js', libjs);

  // compile and move js files
  watch(['./src/javascripts/**/*.js', '!./src/javascripts/libs/*.js'], javascripts);

  // compile and move scss files
  watch('./src/scss/**/*.scss', styles);

  // move images
  watch('./src/images/**/*', images);
});

module.exports = function () {
  return gulp.start('build:start');
};
