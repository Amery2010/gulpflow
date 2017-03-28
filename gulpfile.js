const gulp = require('gulp');
const clean = require('gulp-clean');
const build = require('./gulptask/build');
const deploy = require('./gulptask/deploy');

gulp.task('clean', () => {
  return gulp.src('./dist', { read: false })
    .pipe(clean());
});

gulp.task('build', ['clean'], build);

gulp.task('staging', ['clean'], deploy.staging);

gulp.task('production', ['clean'], deploy.production);

gulp.task('start', ['clean'], () => gulp.start('watch'));

gulp.task('help', () => {
  console.log(`
  gulp start        打包项目文件并监听其变化
  gulp build        打包项目文件
  gulp staging      压缩并打包项目文件
  gulp production   压缩并打包项目文件、上传静态文件至 CDN
  `);
});

gulp.task('default', () => gulp.start('start'));
