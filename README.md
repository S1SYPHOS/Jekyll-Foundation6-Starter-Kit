# Jekyll-Foundation6-Starter-Kit

**You heard about the Foundation framework and want to use it on your next project? You also love Jekyll and don't want to miss it? Then THIS is for you!**

Here's my personal Jekyll+Foundation6-Starter-Kit - starring:
+ [Jekyll](http://jekyllrb.com/) - a blog-aware, static site generator.
+ [Foundation 6](http://foundation.zurb.com/) - a responsive front-end framework.

## The Stack
All you need to get started:
- [Ruby](http://www.ruby-lang.org/): Required for Jekyll.
- [Node.js](http://nodejs.org/) and [NPM](https://npmjs.org/): Required for Grunt & Grunt-plugins.
- [Gulp](http://gulpjs.com/): Automates development.
- [Bower](http://bower.io/): Manages frontend dependencies.
- [Bundler](http://bundler.io/): Manages Ruby dependencies.

### The Setup
- Install [Ruby](https://www.ruby-lang.org/en/documentation/installation/)
- Install [Node.js](http://nodejs.org/) and [NPM](https://npmjs.org/)
- Install [Gulp](http://gulpjs.com/): `npm install -g gulpjs/gulp-cli#4.0`
- Install [Bower](http://bower.io/): `npm install -g bower`
- Install [Bundler](http://bundler.io/): `gem install bundler`

## The Dependencies
Now it's time to install the project's dependencies:
- NPM: `npm cache clean && npm install`
- Bower: `bower install`
- Bundler: `bundle install`

## The Gulp
Everything's ready to get started right away - and here's how:

### Workflow

- WORK
- IN
- PROGRESS

### You want to use pre-compressed assets?

No sweat, just include this snippet in your `.htaccess`:
```apacheconf
## GZIP-HANDLING
## See: https://github.com/sergejmueller/sergejmueller.github.io/wiki/Grunt%3A-GZIP-Komprimierung
<FilesMatch "\.(js|css)\.gz$">
  Header append Content-Encoding gzip
  Header append Vary Accept-Encoding
</FilesMatch>

RewriteCond %{REQUEST_URI} \/(css|js)\/
RewriteCond %{HTTP:Accept-encoding} gzip
RewriteCond %{REQUEST_FILENAME}\.gz -s
RewriteRule ^(.*)\.(css|js)$ $1\.$2\.gz [QSA]

RewriteRule \.css\.gz$ - [T=text/css,E=no-gzip:1]
RewriteRule \.js\.gz$ - [T=application/javascript,E=no-gzip:1]
```

## Special Thanks
I'd like to thank everybody that's making great software - you people are awesome. Also I'm always thankful for feedback and bug reports :)
