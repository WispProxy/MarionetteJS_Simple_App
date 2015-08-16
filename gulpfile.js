"use strict";

var ignoreOptimizationSuffix = '_ignore';

var path = {
    build: {
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/',
        media: 'build/media/',
        fonts: 'build/fonts/'
    },
    src: {
        html: ['src/**/*.html', '!src/**/_*.html', '!src/bower_components/**/*'],
        js: ['src/js/**/*.js', '!src/js/**/_*.js'],
        style: 'src/styles/main.less',
        media: 'src/media/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        style: 'src/styles/**/*.less',
        media: 'src/media/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    clean: './build'
};

var ipAddress = getIpAddress();

var gulp = require("gulp"),
    less = require("gulp-less"),
    sourcemaps = require("gulp-sourcemaps"),
    autoprefixer = require("gulp-autoprefixer"),
    size = require("gulp-size"),
    mainBowerFiles = require("main-bower-files"),
    filter = require("gulp-filter"),
    flatten = require("gulp-flatten"),
    watch = require('gulp-watch'),
    uglify = require('gulp-uglify'),
    rigger = require('gulp-rigger'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    newer = require('gulp-newer'),
    csso = require('gulp-csso'),
    rename = require("gulp-rename"),
    plumber = require("gulp-plumber"),
    rimraf = require("rimraf");

gulp.task('build:html', function () {
    return gulp.src(path.src.html)
        .pipe(plumber({errorHandler: plumberErrorHandler}))
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html));
});

gulp.task('build:styles', function () {
    return gulp.src(path.src.style)
        .pipe(plumber({errorHandler: plumberErrorHandler}))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(autoprefixer('last 1 version'))
        .pipe(csso())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.build.css))
        .pipe(size());
});

//gulp.task('scripts', function () {
//    return gulp.src('app/scripts/**/*.js')
//        .pipe($.jshint())
//        .pipe($.jshint.reporter(require('jshint-stylish')))
//        .pipe($.size());
//});
//

gulp.task('build:js', function () {
    return gulp.src(path.src.js)
               .pipe(plumber({errorHandler: plumberErrorHandler}))
               .pipe(rigger())
               .pipe(sourcemaps.init())
               .pipe(uglify())
               .pipe(sourcemaps.write('.'))
               .pipe(gulp.dest(path.build.js))
               .pipe(size());
});

gulp.task('build:media', function() {
    var png_filter = filter('*.png'),
        skipNoOptimFilter = filter('!**/*' + ignoreOptimizationSuffix + '.*'),
        onlyNoOptimFilter = filter('**/*' + ignoreOptimizationSuffix + '.*');

    return gulp.src(path.src.media)
        .pipe(newer(path.build.media))
        .pipe(plumber({errorHandler: plumberErrorHandler}))
        .pipe(skipNoOptimFilter)
        .pipe(imagemin({
            optimizationLevel: 3,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            interlaced: true
        }))
        .pipe(png_filter)
        .pipe(pngquant()())
        .pipe(png_filter.restore())
        .pipe(skipNoOptimFilter.restore())
        .pipe(onlyNoOptimFilter)
        .pipe(rename(function (path) {
            path.basename = path.basename.replace(ignoreOptimizationSuffix, '');
        }))
        .pipe(onlyNoOptimFilter.restore())
        .pipe(gulp.dest(path.build.media));
});

gulp.task('build:fonts', function() {
    return gulp.src(mainBowerFiles().concat(path.src.fonts))
        .pipe(plumber({errorHandler: plumberErrorHandler}))
        .pipe(filter('**/*.{eot,svg,ttf,woff,woff2}'))
        .pipe(flatten())
        .pipe(gulp.dest(path.build.fonts))
        .pipe(size());
});

gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

gulp.task('build', [
    'build:styles',
    'build:media',
    'build:fonts',
    'build:html',
    'build:js'
]);

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

var lr;

gulp.task('connect', function () {
    var connect = require('connect');

    var app = connect()
        .use(require('connect-livereload')({ port: 35729 }))
        .use(connect.static('build'))
        .use(connect.directory('build'));

    lr = require('tiny-lr')();
    lr.listen(35729);

    require('http').createServer(app)
        .listen(9000)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:9000');
        });
});

gulp.task('serve', ['connect', 'build'], function () {
    require('opn')('http://' + ipAddress + ':9000');
});

gulp.task('watch', ['build', 'connect'], function() {

    console.log("Opening page " + 'http://' + ipAddress + ':9000');
    require('opn')('http://' + ipAddress + ':9000');

    watch([path.watch.html], function(event, cb) {
        gulp.start('build:html', function() {
            lr.changed({body: {files: [require('path').relative(__dirname, event.path)]}});
        });
    });

    watch([path.watch.style], function(event, cb) {
        gulp.start('build:styles', function() {
            lr.changed({body: {files: [require('path').relative(__dirname, event.path)]}});
        });
    });

    watch([path.watch.js], function(event, cb) {
        gulp.start('build:js', function() {
            lr.changed({body: {files: [require('path').relative(__dirname, event.path)]}});
        });
    });

    watch([path.watch.media], function(event, cb) {
        gulp.start('build:media', function() {
            lr.changed({body: {files: [require('path').relative(__dirname, event.path)]}});
        });
    });

    watch([path.watch.fonts], function(event, cb) {
        gulp.start('build:fonts', function() {
            lr.changed({body: {files: [require('path').relative(__dirname, event.path)]}});
        });
    });
});

// -----------------------------------------------

function getIpAddress() {
    // for getting current IP

    var os = require('os'),
        ifaces = os.networkInterfaces();

    var lookupIpAddress = null;

    for (var dev in ifaces) {
        if(dev !== "en1" && dev !== "en0") {
            continue;
        }

        ifaces[dev].forEach(function(details) {
            if (details.family === "IPv4") {
                lookupIpAddress = details.address;
            }
        });
    }

    return lookupIpAddress;
}

function plumberErrorHandler(err) {
    console.log(err.message);
    this.emit('end');
}
