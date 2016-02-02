gulp = require 'gulp'
connect = require 'gulp-connect'

gulp.task 'webserver', ->
    connect.server 
        root: 'build'
        port: 8888
        livereload: true

gulp.task 'build', ->
    gulp.src ['src/**/*.html', 'src/**/*.js', 'src/**/*.jpg']
        .pipe gulp.dest 'build'
        .pipe connect.reload()

gulp.task 'watch', ->
    gulp.watch ['src/**/*'], ['build']

gulp.task 'default', ['build', 'webserver', 'watch']