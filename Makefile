#build:
#	bundle install

open:
	(sleep 2 ; open http://localhost:4000/) &
#	bundle exec jekyll serve
	jekyll serve

anon:
	(sleep 2 ; open http://localhost:4000/anon.html) &
	jekyll serve
clean:
	rm -rf *~

