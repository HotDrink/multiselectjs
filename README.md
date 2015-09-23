# MultiselectJS

A library for implementing selection of multiple elements from visual collections with a mouse and keyboard.

## Using the library

Installation means to include the `dist/multiselect.js` script.
Alternatively one can use the library as a CommonJS module,
importing it as `var multiselect = require('multiselectjs');`.
Additional functionality (selection geometries) can be required
as `'multiselectjs/js/filename'`.

The library is meant to be run on the browser, so tools like Browserify
could/should be applied to use the library as a module.

Please consult the [library's home pages](http://hotdrink.github.io/multiselectjs/) for tutorials and further guidance on how to use the library.

## Project layout

The repository is organized as follows.

    - `org` - Source of the library and documentation, written in a /literate programming/ style in Emacs' org-mode.
    - `org-docs` - Additional documentation (tutorial) written in org-mode markup.
    - `js` - JavaScript source codes of the library, generated from files in the `org` directory.
    - `dist` - JavaScript bundles to be included as scripts to web pages.
    - `dist-docs` - HTML documentation built from sources in `org` and `org-docs`.
    - `test` - Tests and a test harness. Unit tests are generated from files in `org`.
    - `examples` - Example applications.

Since Emacs and LaTeX are not installed in every computer,
the generated files are committed in to the repository at each release.
as well.

## Building

Install Node dependencies with the command `npm install`.
Then the command `npm run build` builds the scripts in `dist` from sources in `js`.

There is also a `Makefile` that builds the `js` files from `org` files, builds
documentation, creates a new version of the library's web-pages (to be committed
to the gh-pages branch) etc.

A few of the useful targets are:

- `dist`

  - build sources to `js` from `org`-files, build the standalone scripts
  to `dist` using Browserify

- `docs`

  - build the tutorial and other documentation from org files

- `test`

  - build tests and run them (open's a browser page)

- `track-generated-on`, `track-generated-off`
  - marks tracking generated files by git on/off (it only makes sense to commit
    the generated files in for releases).
