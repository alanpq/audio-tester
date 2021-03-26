'use strict';
 
const gulp = require('gulp');
const gulp_sass = require('gulp-sass');
const gulp_pug = require('gulp-pug');
 
gulp_sass.compiler = require('node-sass');

exports["pug"] = function pug () {
  return gulp.src('./views/**/*.pug')
    .pipe(gulp_pug())
    .pipe(gulp.dest('./dist/'))
}

exports["pug:watch"] = function pug_watch() {
  return gulp.watch('./views/**/*.pug', exports['pug']);
}
 
exports["sass"] = function sass () {
  return gulp.src('./public/style/*.scss')
    .pipe(gulp_sass().on('error', gulp_sass.logError))
    .pipe(gulp.dest('./dist/style'));
};

exports["sass:watch"] = function sass_watch() {
  return gulp.watch('./public/style/*.scss', exports['sass']);
}

exports["js"] = function js () {
  return gulp.src('./public/script/*.js')
    .pipe(gulp.dest('./dist/script/'));
};
exports["js:watch"] = function js_watch() {
  return gulp.watch('./public/script/*.js', exports['js']);
}

exports['frontend'] = gulp.parallel(exports['pug'], exports['sass'], exports['js'])

exports.default = exports['frontend']