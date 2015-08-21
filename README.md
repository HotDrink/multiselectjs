# MultiselectJS

A library for implementing selection of multiple elements from visual collections with a mouse and keyboard.

## Using the library

Installation means to include the `dist/multiselect.min.js` script.
Alternatively one can include 
`dist/multiselect_with_extras.min.js` that provides some additional
utility functions.

Please consult the [library's home pages](http://hotdrink.github.io/multiselectjs/) for tutorials and further guidance on how to use the library.

## Project layout

The repository is organized as follows.

    - `org` - Source of the library and documentation, written in a /literate programming/ style in Emacs' org-mode.
    - `org-docs` - Additional documentation (tutorial) written in org-mode markup.
    - `js` - JavaScript source codes of the library, generated from files in the `org` directory.
    - `dist` - JavaScript bundles, to be included as scripts to web pages.
    - `dist-docs` - HTML documentation built from sources in `org` and `org-docs`.
    - `test` - Tests and a test harness. Unit tests are generated from files in `org`.
    - `examples` - Example applications.

Since Emacs and LaTeX are not installed in every computer,
the generated files are committed in to the repository at each release.
as well.

## Building

The command `npm run build` builds the scritps in `dist` from sources in `js`

There is also a `Makefile` that builds the `js` files from `org` files, builds
documentation, creates a new version of the library's web-pages (to be committed
to the gh-pages branch) etc.

A few of the useful targets are:

- `dist`

  - build soruces to `js` from `org`-files, build the standalone and minimized scripts
    to `dist` using Browserify, Babelify, and Uglify.

- `docs`

  - build the tutorial and other documentaiton

- `test`

  - build tests and run them (open's a browser page)

- `track-generated-on`, `track-generated-off`
  - marks tracking generated files by git on/off (it only makes sense to commit
    the generated files in for releases).



