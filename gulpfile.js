'use strict';

// ## Globals
var $$            = require('gulp-load-plugins')({rename: {'gulp-scss-lint': 'scsslint', 'gulp-minify-css': 'minifycss'}});
var argv         = require('minimist')(process.argv.slice(2));
var del          = require('del');
var gulp         = require('gulp');
var lazypipe     = require('lazypipe');
var merge        = require('merge-stream');
var shell        = require('shelljs');

// BROWSERSYNC -- http://www.browsersync.io/docs/gulp/
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// ASSET-BUILDER -- https://github.com/austinpray/asset-builder
// -- Credits to the great people over at https://github.com/roots/sage
//
var manifest = require('asset-builder')('./source/_data/manifest.json');

// 'path' - Paths to base asset directories. With trailing slashes.
// -- 'path.source' - Path to the source files. Default: 'assets/'
// -- 'path.dist' - Path to the build directory. Default: 'dist/'
var path = manifest.paths;

// 'globs' - These ultimately end up in their respective 'gulp.src'.
// -- 'globs.js' - Array of asset-builder JS dependency objects. Example:
//   '''
//   {type: 'js', name: 'main.js', globs: []}
//   '''
// -- 'globs.css' - Array of asset-builder CSS dependency objects. Example:
//   '''
//   {type: 'css', name: 'main.css', globs: []}
//   '''
// -- 'globs.fonts' - Array of font path globs.
// -- 'globs.images' - Array of image path globs.
// -- 'globs.bower' - Array of all the main Bower files.
var globs = manifest.globs;

// 'project' - paths to first-party assets.
// -- 'project.js' - Array of first-party JS assets.
// -- 'project.css' - Array of first-party CSS assets.
var project = manifest.getProjectGlobs();


// ## REUSABLE PIPELINES -- https://github.com/OverZealous/lazypipe
//

// # CSS PROCESSING PIPELINE
//
var cssTasks = function(filename) {
  return lazypipe()
    .pipe(function() {
      return $$.if(!argv.prod, $$.plumber());
    })
    .pipe(function() {
      return $$.if(!argv.prod, $$.sourcemaps.init());
    })
    .pipe(function() {
      return $$.sass({
        outputStyle: 'expanded',
        precision: 10,
        includePaths: ['.']
      }).on('error', $$.sass.logError);
    })
    .pipe($$.concat, filename)
    .pipe($$.autoprefixer, {
      browsers: [
        'last 2 versions',
        'android 4',
        'opera 12'
      ]
    })
    .pipe($$.size, {
      title: 'styles',
      showFiles: true
    })

    // Production settings
    .pipe(function() {
      return $$.if(argv.prod, $$.minifycss({
        advanced: false,
        rebase: false
      }));
    })
    .pipe(function() {
      return $$.if(argv.prod, $$.size({
        title: 'minified styles',
        showFiles: true
      }));
    })
    .pipe(function() {
      return $$.if(argv.prod, $$.gzip({
        preExtension: 'gz'
      }));
    })
    .pipe(function() {
      return $$.if(argv.prod, $$.size({
        title: 'gzipped styles',
        gzip: true,
        showFiles: true
      }));
    })
    .pipe(function() {
      return $$.if(argv.prod, $$.rev());
    })
    .pipe(function() {
      return $$.if(!argv.prod, $$.sourcemaps.write('.', {
        sourceRoot: 'assets/styles/'
      }));
    })();
};


// # JS PROCESSING PIPELINE
//
var jsTasks = function(filename) {
  return lazypipe()
    .pipe(function() {
      return $$.if(!argv.prod, $$.sourcemaps.init());
    })
    .pipe($$.concat, filename)
    .pipe($$.size, {
      title: 'scripts',
      showFiles: true
    })

    // Production settings
    .pipe(function() {
      return $$.if(argv.prod, $$.uglify({
        compress: {
          'drop_debugger': true
        }
      }));
    })
    .pipe(function() {
      return $$.if(argv.prod, $$.size({
        title: 'minified scripts',
        showFiles: true
      }));
    })
    .pipe(function() {
      return $$.if(argv.prod, $$.gzip({
        preExtension: 'gz'
      }));
    })
    .pipe(function() {
      return $$.if(argv.prod, $$.size({
        title: 'gzipped scripts',
        gzip: true,
        showFiles: true
      }));
    })
    .pipe(function() {
      return $$.if(argv.prod, $$.rev());
    })
    .pipe(function() {
      return $$.if(!argv.prod, $$.sourcemaps.write('.', {
        sourceRoot: 'assets/scripts/'
      }));
    })
    .pipe(function() {
      return $$.if(!argv.prod, browserSync.stream());
    })();
};


// ## GULP TASKS
// 'gulp -T' for a task summary
//

// # JSHINT
// 'gulp jsHint' - Lints project JS.
//
gulp.task('jsHint', function() {
  return gulp.src(['gulpfile.js'].concat(project.js))
    .pipe($$.jshint())
    .pipe($$.jshint.reporter('jshint-stylish'))
    .pipe($$.if(argv.prod, $$.jshint.reporter('fail')));
});

// # SCSS-LINT
// 'gulp scss-lint' - Lints project SCSS.
//
gulp.task('scssLint', function() {
  return gulp.src('source/assets/styles/**/*.scss')
    .pipe($$.scsslint());
});

// # Wiredep -- https://github.com/taptapship/wiredep
// 'gulp wiredep' - Automatically inject Sass Bower dependencies. See
//
gulp.task('wiredep', function() {
  var wiredep = require('wiredep').stream;
  return gulp.src(project.css)
    .pipe(wiredep())
    .pipe($$.changed(path.source + 'styles', {
      hasChanged: $$.changed.compareSha1Digest
    }))
    .pipe(gulp.dest(path.source + 'styles'));
});


// # Styles
// 'gulp styles' - Compiles, combines, and optimizes Bower CSS and project CSS.
// By default this task will only log a warning if a precompiler error is
// raised. If the '--production' flag is set: this task will fail outright.
//
gulp.task('styles', gulp.series('wiredep', function() {
  var merged = merge();
  manifest.forEachDependency('css', function(dep) {
    var cssTasksInstance = cssTasks(dep.name);
    merged.add(gulp.src(dep.globs, {base: 'styles'})
      .pipe(cssTasksInstance));
  });
  return merged
    .pipe(gulp.dest(path.dist + 'styles'));
}));

// # Scripts
// 'gulp scripts' - Runs jsHint then compiles, combines, and optimizes Bower JS
// and project JS.
//
gulp.task('scripts', gulp.series(function() {
  var merged = merge();
  manifest.forEachDependency('js', function(dep) {
    var jsTasksInstance = jsTasks(dep.name);
    merged.add(gulp.src(dep.globs, {base: 'scripts'})
      .pipe(jsTasksInstance));
  });
  return merged
    .pipe(gulp.dest(path.dist + 'scripts'));
}));

// # Fonts
// 'gulp fonts' - Grabs all the fonts and outputs them in a flattened directory
// structure. See: https://github.com/armed/gulp-flatten
//
gulp.task('fonts', function() {
  return gulp.src(globs.fonts)
    .pipe($$.flatten())
    .pipe($$.size({
      title: 'fonts'
    }))
    .pipe(gulp.dest(path.dist + 'fonts'));
});

// # Images
// 'gulp images' - Run lossless compression on all the images.
//
gulp.task('images', function() {
  return gulp.src(globs.images)
    .pipe($$.cache($$.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{removeUnknownsAndDefaults: false}, {cleanupIDs: false}]
    })))
    .pipe($$.size({
      title: 'images'
    }))
    .pipe(gulp.dest(path.dist + 'images'));
});


// # HTML
// 'gulp html' -- does nothing
// 'gulp html --prod' -- minifies and gzips our HTML files
//
gulp.task('html', function() {
  return gulp.src('build/**/*.html')
    .pipe($$.if(argv.prod, $$.htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      keepClosingSlash: true,
      minifyCSS: true,
      minifyJS: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true
    })))
    .pipe($$.if(argv.prod, $$.size({title: 'optimized HTML'})))
    .pipe($$.if(argv.prod, gulp.dest('build')))
    .pipe($$.if(argv.prod, $$.gzip({append: true})))
    .pipe($$.if(argv.prod, $$.size({
      title: 'gzipped HTML',
      gzip: true
    })))
    .pipe($$.if(argv.prod, gulp.dest('build')));
});


// # Injections
// 'gulp inject:head' -- injects our style.css file into the head of our HTML
//
gulp.task('inject:head', function() {
  return gulp.src('source/_includes/head.html')
    .pipe($$.inject(gulp.src('.tmp/assets/styles/*.css', {read: false}), {ignorePath: '.tmp'}))
    .pipe(gulp.dest('source/_includes'));
});

// 'gulp inject:footer' -- injects our index.js file into the end of our HTML
//
gulp.task('inject:footer', function() {
  return gulp.src('source/_layouts/default.html')
    .pipe($$.inject(gulp.src('.tmp/assets/scripts/*.js', {read: false}), {ignorePath: '.tmp'}))
    .pipe(gulp.dest('source/_layouts'));
});


// # Building Jekyll
// 'gulp jekyll' -- builds your site with development settings
// 'gulp jekyll --prod' -- builds your site with production settings
//
gulp.task('jekyll', function(done) {
  if (!argv.prod) {
    shell.exec('jekyll build');
    done();
  } else if (argv.prod) {
    shell.exec('jekyll build --config _config.yml,_config.build.yml');
    done();
  }
});


// # Jekyll doctor
// 'gulp jekyll:doctor' -- literally just runs jekyll doctor
//
gulp.task('jekyll:doctor', function(done) {
  shell.exec('jekyll doctor');
  done();
});


// # Clean
// 'gulp clean:assets' -- deletes all assets except for images
// 'gulp clean:dist' -- erases the dist folder
// 'gulp clean:gzip' -- erases all the gzipped files
// 'gulp clean:metadata' -- deletes the metadata file for Jekyll
gulp.task('clean:assets', function(done) {
  del(['.tmp/**/*', '!.tmp/assets', '!.tmp/assets/images', '!.tmp/assets/images/**/*', 'build/assets']);
  done();
});
gulp.task('clean:dist', function(done) {
  del(['build/']);
  done();
});
gulp.task('clean:gzip', function(done) {
  del(['build/**/*.gz']);
  done();
});
gulp.task('clean:metadata', function(done) {
  del(['source/.jekyll-metadata']);
  done();
});
// 'gulp clean' -- erases your assets and gzipped files
gulp.task('clean', gulp.series('clean:assets', 'clean:gzip'));


// ### Assets
// 'gulp assets' -- cleans out your assets and rebuilds them
// 'gulp assets --prod' -- cleans out your assets and rebuilds them with production settings
// gulp.task('assets', gulp.series(
//   gulp.series('clean:assets'),
//   gulp.parallel('styles', 'scripts', 'fonts', 'images')
// ));
//
gulp.task('assets', gulp.series(
  gulp.series('clean:assets'),
  gulp.parallel('styles', 'scripts', 'images'),
  'fonts'
));

// 'gulp assets:copy' -- copies the assets into the dist folder, needs to be
// done this way because Jekyll overwrites the whole folder otherwise
gulp.task('assets:copy', function() {
  return gulp.src('.tmp/assets/**/*')
    .pipe(gulp.dest('build/assets'));
});


// # Gulp serve
// 'gulp serve' -- open up your website in your browser and watch for changes
// in all your files and update them when needed
//
gulp.task('serve', function() {
  browserSync({
    // tunnel: true,
    // open: false,
    server: {
      baseDir: ['.tmp', 'build']
    }
  });

  // Watch various files for changes and do the needful
  gulp.watch(['source/**/*.md', 'source/**/*.html', 'source/**/*.yml'], gulp.series('jekyll', reload));
  gulp.watch(['source/**/*.xml', 'source/**/*.txt'], gulp.series('jekyll', reload));
  gulp.watch([path.source + 'styles/**/*'], gulp.series('styles', reload));
  gulp.watch([path.source + 'scripts/**/*'], gulp.series('jsHint', 'scripts', reload));
  gulp.watch([path.source + 'fonts/**/*'], gulp.series('fonts', reload));
  gulp.watch([path.source + 'images/**/*'], gulp.series('images', reload));
  gulp.watch(['bower.json', 'source/assets/_manifest.json'], gulp.series('assets', reload));
});

// ## Gulp
// 'gulp' -- cleans your assets and gzipped files, creates your assets and
// injects them into the templates, then builds your site, copied the assets
// into their directory and serves the site
// 'gulp --prod' -- same as above but with production settings
//
gulp.task('default', gulp.series(
  gulp.series('clean:assets', 'clean:gzip'),
  gulp.series('assets', 'inject:head', 'inject:footer'),
  gulp.series('jekyll', 'assets:copy', 'html'),
  gulp.series('serve')
));

// # Gulp build
// 'gulp build' -- same as 'gulp' but doesn't serve your site in your browser
// 'gulp build --prod' -- same as above but with production settings
//
gulp.task('build', gulp.series(
  gulp.series('clean:assets', 'clean:gzip'),
  gulp.series('assets', 'inject:head', 'inject:footer'),
  gulp.series('jekyll', 'assets:copy', 'html')
));

// # Gulp rebuild
// 'gulp rebuild' -- WARNING: Erases your assets and built site, use only when
// you need to do a complete rebuild
gulp.task('rebuild', gulp.series('clean:dist', 'clean:assets', 'clean:metadata'));

// # Gulp check
// 'gulp check' -- checks your Jekyll configuration for errors and lints both SCSS + JS
//
gulp.task('check', gulp.series('jekyll:doctor', 'jsHint', 'scssLint'));
