REPORTER ?= dot

build: test
	@./node_modules/.bin/component build

test: ./test/specs.js
	@./node_modules/.bin/mocha $^ \
		--reporter $(REPORTER)

lint: ./lib/*.js
	@./node_modules/.bin/jshint $^ \
		--reporter ./node_modules/jshint-stylish/stylish.js

clean:
	rm -fr build components

.PHONY: build, clean, test
