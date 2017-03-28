const gulp = require('gulp');
const rollup = require('gulp-rollup');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const sass = require('gulp-sass');
const imagemin = require('gulp-imagemin');
const qiniu = require('gulp-qiniu');
const replace = require('gulp-replace');
const config = require('../config');

const srcRegs = {
  jsInHtml: /<\s*script\s+.*src\s*=\s*["|']([^"']+)[^>]*><\s*\/\s*script\s*>/gim,
  dataSrcInHtml: /<\s*script\s+.*data\-src\s*=\s*["|']([^"']+)[^>]*><\s*\/\s*script\s*>/gim,
  cssInHtml: /<\s*link\s+.*href\s*=\s*["|']([^"']+)[^>]*>/gim,
  imageInHtml: /<\s*img\s+.*src\s*=\s*["|']([^"']+)[^>]*>/gim,
  imageInCSS: /url\s*\(\s*['|"]?([^'")]+)['|"]?\s*\)/gim
};

let timestamp = '';
const replaceRegs = {
  absoluteLink: /^(http(s)?\:)?\/\/\w+/ig,
  relativeLink: /^[\.{0,2}\/]*(\w+)/ig,
  joiner: /\w+\?\w+=\w+/gim
};

function replaceLink(target, link) {
  if (replaceRegs.absoluteLink.test(link)) {
    return target;
  }
  const joiner = replaceRegs.joiner.test(link) ? '&' : '?';
  const absoluteLink = link.replace(replaceRegs.relativeLink, config.CDNBaseUrl + '$1') + joiner + 't=' + timestamp;
  return target.replace(link, absoluteLink);
}

gulp.task('deploy:html', () => {
  return gulp.src('./src/**/*.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('deploy:css', () => {
  return gulp.src('./src/scss/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 4 versions', 'Android >= 4.4']
    }))
    .pipe(cssnano())
    .pipe(gulp.dest('./dist/styles'));
});

gulp.task('deploy:libjs', () => {
  return gulp.src('./src/javascripts/libs/*.js')
    .pipe(gulp.dest('./dist/javascripts/libs'));
});

gulp.task('deploy:js', () => {
  return gulp.src(['./src/javascripts/**/*.js', '!./src/javascripts/libs/*.js'])
    .pipe(rollup({
      entry: './src/javascripts/main.js',
      format: 'iife'
    }))
    .pipe(babel({
      presets: ['es2015', 'stage-2']
    }))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(uglify())
    .pipe(gulp.dest('./dist/javascripts'));
});

gulp.task('deploy:images', () => {
  return gulp.src('./src/images/**/*')
    .pipe(imagemin())
    .pipe(gulp.dest('./dist/images'));
});

gulp.task('deploy:cdn', ['deploy:html', 'deploy:css'], () => {
  timestamp = new Date().getTime();
  
  return gulp.src('./dist/**/*.{html,css}')
    .pipe(replace(srcRegs.jsInHtml, replaceLink))
    .pipe(replace(srcRegs.cssInHtml, replaceLink))
    .pipe(replace(srcRegs.imageInHtml, replaceLink))
    .pipe(replace(srcRegs.dataSrcInHtml, replaceLink))
    .pipe(replace(srcRegs.imageInCSS, replaceLink))
    .pipe(gulp.dest('./dist'));
});

gulp.task('deploy:upload', ['deploy:cdn', 'deploy:images', 'deploy:libjs', 'deploy:js'], () => {
  return gulp.src(['./dist/**/*', '!./dist/**/*.html'])
    .pipe(qiniu(config.qiniu.config, {
      dir: config.qiniu.dir,
      versioning: false
    }));
});

gulp.task('deploy:staging', ['deploy:html', 'deploy:css', 'deploy:images', 'deploy:libjs', 'deploy:js']);

gulp.task('deploy:production', () => gulp.start('deploy:upload'));

module.exports = {
  staging: function () {
    return gulp.start('deploy:staging');
  },
  production: function () {
    return gulp.start('deploy:production');
  }
};
