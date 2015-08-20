# MultiselectJS

A library for implementing selection of multiple elements from visual collections with a mouse and keyboard.

Please consult the [http://hotdrink.github.io/multiselectjs/][library's home pages] for tutorials etc. on how to use the library.

## Project layout

The repository is organized as follows.

    - `org` - Source of the library and documentation, written mostly in Emacs' org-mode in literate programming style
    - `org-docs` - Additional documentation (tutorial) written in org-mode markup
    - `js` - JavaScript source codes of the library, generated from files in the `org` directory
    - `dist` - JavaScript bundles, to be included as scripts to web pages
    - `dist-docs` - HTML documentation built from sources in `org` and `org-docs`
    - `test` - Tests and test harness. Unit tests are generated from files in `org`
    - `examples` - Example applications
