build:
	bundle install

open:
	(sleep 2 ; open http://localhost:4000/) &
	bundle exec jekyll serve

clean:
	rm -rf *~
