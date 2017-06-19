const gulp = require('gulp');
const watch = require('gulp-watch');
const eslint = require('gulp-eslint');
const rollup = require('gulp-rollup');
const babel = require('gulp-babel');
const autoprefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const px2rem = require('gulp-px2rem');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;

function html() {
  return gulp.src('./src/**/*.html')
    .pipe(gulp.dest('./dist'));
}

function images() {
  return gulp.src(['./src/images/**/*', './src/favicon.ico'], { base: './src' })
    .pipe(gulp.dest('./dist'));
}

function libjs() {
  return gulp.src('./src/javascripts/libs/**/*.js')
    .pipe(gulp.dest('./dist/javascripts/libs'));
}

function javascripts() {
  return gulp.src(['./src/javascripts/**/*.js', '!./src/javascripts/libs/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(rollup({
      entry: './src/javascripts/main.js',
      format: 'iife'
    }))
    .pipe(babel({
      presets: ['es2015', 'stage-2']
    }))
    .pipe(gulp.dest('./dist/javascripts'));
}

function styles() {
  return gulp.src('./src/scss/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: [
        'ie >= 9',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
      ],
      cascade: true,
      remove: true
    }))
    .pipe(px2rem({
      replace: false,
      rootValue: 75
    }))
    .pipe(gulp.dest('./dist/styles'));
}

// 静态服务器
gulp.task('browser-sync', function () {
  browserSync.init({
    server: {
      baseDir: './dist'
    },
    port: 3000,
    injectChanges: true,
    notify: false
  });
});

gulp.task('build:html', html);

gulp.task('build:images', images);

gulp.task('build:libjs', libjs);

gulp.task('build:javascripts', javascripts);

gulp.task('build:styles', styles);

gulp.task('build:start', ['build:html', 'build:images', 'build:libjs', 'build:javascripts', 'build:styles']);

gulp.task('watch', ['build:start', 'browser-sync'], () => {
  // move html files
  watch('./src/**/*.html', () => {
    return html().pipe(reload({stream: true}));
  });

  // move lib js files
  watch('./src/javascripts/libs/**/*.js', () => {
    return libjs().pipe(reload({stream: true}));
  });

  // compile and move js files
  watch(['./src/javascripts/**/*.js', '!./src/javascripts/libs/*.js'], () => {
    return javascripts().pipe(reload({stream: true}));
  });

  // compile and move scss files
  watch('./src/scss/**/*.scss', () => {
    return styles().pipe(reload({stream: true}));
  });

  // move images
  watch('./src/images/**/*', () => {
    return images().pipe(reload({stream: true}));
  });
});

module.exports = function () {
  return gulp.start('build:start');
};
