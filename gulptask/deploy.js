const gulp = require('gulp');
const rollup = require('gulp-rollup');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const sass = require('gulp-sass');
const px2rem = require('gulp-px2rem');
const imagemin = require('gulp-imagemin');
const qiniu = require('gulp-qiniu');
const replace = require('gulp-replace');
const sourcemaps = require('gulp-sourcemaps');
const sitemap = require('gulp-sitemap');
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
    .pipe(gulp.dest('./dist'))
    .pipe(sitemap({
      siteUrl: `${config.project.url}`
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('deploy:css', () => {
  return gulp.src('./src/scss/main.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: [
        'last 3 version',
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
    .pipe(cssnano())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/styles'));
});

gulp.task('deploy:libjs', () => {
  return gulp.src('./src/javascripts/libs/**/*.js')
    .pipe(gulp.dest('./dist/javascripts/libs'));
});

gulp.task('deploy:js', () => {
  return gulp.src(['./src/javascripts/**/*.js', '!./src/javascripts/libs/**/*.js'])
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
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/javascripts'));
});

gulp.task('deploy:images', () => {
  return gulp.src(['./src/images/**/*', './src/favicon.ico'], { base: './src' })
    .pipe(imagemin({
      progressive: true,
      optimizationLevel: 5
    }))
    .pipe(gulp.dest('./dist'));
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
  return gulp.src('./dist/**/*')
    .pipe(qiniu(config.qiniu.config, {
      dir: config.qiniu.dir,
      versioning: false
    }));
});

gulp.task('deploy:build', ['deploy:html', 'deploy:css', 'deploy:images', 'deploy:libjs', 'deploy:js']);

gulp.task('deploy:staging', ['deploy:build']);

gulp.task('deploy:production', ['deploy:build'], () => gulp.start('deploy:upload'));

module.exports = {
  staging: function () {
    return gulp.start('deploy:staging');
  },
  production: function () {
    return gulp.start('deploy:production');
  }
};
