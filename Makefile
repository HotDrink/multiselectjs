EMACS := emacs

LIBRARY_ORGS := org/multiselect_library.org \
	org/selection_geometries.org \
	org/extras.org \

TANGLED := $(LIBRARY_ORGS:.org=.tangled)

DOCS := org/multiselect_library.html org-docs/index/index.html

.PHONY: tangle docs tutorial dist pages test

test: dist
	open test/testindex.html


pages: docs dist
	cp org-docs/index/index.html ../multiselectjs-pages/
	cp dist-docs/tutorial/* ../multiselectjs-pages/docs/tutorial/
	cp examples/demo/* ../multiselectjs-pages/examples/demo/
	cp dist/multiselect.min.js ../multiselectjs-pages/dist

tangle: $(TANGLED)

docs: $(DOCS) tutorial 
	cp $(DOCS) dist-docs/

dist-docs/tutorial/tutorial.html:  org-docs/tutorial/tutorial.html dist/multiselect.js
	cp $(TUTORIAL_FILES) dist-docs/tutorial/	


dist/multiselect.js: $(TANGLED)
	npm run build

dist: dist/multiselect.js dist/multiselect.min.js dist/multiselect_with_extras.js dist/multiselect_with_extras.min.js

tutorial: dist-docs/tutorial/tutorial.html

%.tangled: %.org
	$(EMACS) --batch -l org-publish.el $< --eval "(org-tangle)"
	touch $@

%.html: %.org %.tangled
	$(EMACS) --batch -l org-publish.el $< --eval "(publish-org-to-html \".\")"

TUTORIAL_FILES := org-docs/tutorial/tutorial.html \
	org-docs/tutorial/example-1.html \
	org-docs/tutorial/example-2.html \
	org-docs/tutorial/selection_concepts.png \
	org-docs/tutorial/simple-selection-geometry.png \
	org-docs/tutorial/fish.js \


publish:
	scp docs/multiselect_library.html sun.cse.tamu.edu:/home/faculty/jarvi/web_home/tmp/restricted/


clean:
	rm -f *~
	rm -rf dist/*
	rm -rf js/*
	rm -f $(TANGLED)
