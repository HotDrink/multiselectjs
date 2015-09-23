EMACS := emacs

LIBRARY_ORGS := \
	org/multiselect_library.org \
	org/selection_geometries.org \
#	org/extras.org  # currently not used

LIBRARY_TANGLED := $(LIBRARY_ORGS:.org=.tangled)

# files generated from source org files
LIBRARY_DOCS := $(LIBRARY_ORGS:.org=.html)

# other documentation
OTHER_DOCS := \
	org-docs/index/index.html \
	org-docs/tutorial/tutorial.html \
	org-docs/api_reference/api_reference.html


.PHONY: dist tangle docs pages test

# deployable scripts
DIST_SCRIPTS := \
	dist/multiselect.js \
	dist/multiselect.debug.js \
	dist/multiselect_ordered_geometries.js \
	dist/multiselect_dom_geometries.js

dist: $(DIST_SCRIPTS)


$(DIST_SCRIPTS): $(LIBRARY_TANGLED)
	npm run build
	npm run build-ord-geom
	npm run build-dom-geom

%.tangled: %.org
	$(EMACS) --batch -l org-publish.el $< --eval "(org-tangle)"
	touch $@

%.html: %.org %.tangled
	$(EMACS) --batch -l org-publish.el $< --eval "(publish-org-to-html \".\")"

tangle: $(LIBRARY_TANGLED)

GENERATED_TEST_FILES = \
        test/testindex.html \
        test/tests.js

test: dist $(GENERATED_TEST_FILES)
	open test/testindex.html

docs: $(OTHER_DOCS) $(LIBRARY_DOCS)
	mkdir -p dist-docs/library
	cp $(LIBRARY_DOCS) dist-docs/library
	mkdir -p dist-docs/tutorial
	cp $(GENERATED_TUTORIAL_FILES) dist-docs/tutorial
	mkdir -p dist-docs/api_reference
	cp $(GENERATED_API_REFERENCE_FILES) dist-docs/api_reference
	mkdir -p dist-docs/index
	cp $(GENERATED_INDEX_FILES) dist-docs/index

pages: docs dist
	rsync -v dist-docs/index/index.html ../multiselectjs-pages/index.html
	mkdir -p ../multiselectjs-pages/docs
	mkdir -p ../multiselectjs-pages/docs/tutorial
	rsync -v dist-docs/tutorial/* ../multiselectjs-pages/docs/tutorial/
	mkdir -p ../multiselectjs-pages/docs/api_reference
	rsync -v dist-docs/api_reference/* ../multiselectjs-pages/docs/api_reference/
	mkdir -p ../multiselectjs-pages/examples
	mkdir -p ../multiselectjs-pages/examples/demo
	rsync -v examples/demo/* ../multiselectjs-pages/examples/demo/
	mkdir -p ../multiselectjs-pages/dist
	rsync -v dist/multiselect.js ../multiselectjs-pages/dist

GENERATED_INDEX_FILES := org-docs/index/index.html

GENERATED_TUTORIAL_FILES := org-docs/tutorial/tutorial.html \
	org-docs/tutorial/example-1.html \
	org-docs/tutorial/example-2.html \
	org-docs/tutorial/example-3.html \
	org-docs/tutorial/selection_concepts.png \
	org-docs/tutorial/simple-selection-geometry.png \
	org-docs/tutorial/fish.js

GENERATED_API_REFERENCE_FILES := org-docs/api_reference/api_reference.html 

GENERATED_SOURCES = \
	js/multiselect.js \
	js/default_geometry.js \
	js/ordered_geometries.js \
	js/dom_geometries.js 

# Anything committed in in the dist-docs directory
DIST_DOCS := $(shell git ls-files -- dist-docs | tr '\n' ' ')

track-generated-off:
	git update-index --assume-unchanged $(GENERATED_SOURCES) $(GENERATED_TEST_FILES) $(DIST_DOCS) 

track-generated-on:
	git update-index --assume-changed $(GENERATED_SOURCES) $(GENERATED_TEST_FILES) $(DIST_DOCS)

clean:
	rm -fr *~
	rm -rf dist/*
	rm -rf dist-docs/*
	rm -rf js/*
	rm -f $(LIBRARY_TANGLED) $(GENERATED_TEST_FILES)
