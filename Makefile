REPORTER ?= dot

build: test
	@./node_modules/.bin/component build

test: lint
	@./node_modules/.bin/mocha \
		--reporter $(REPORTER)

lint: ./lib/*.js
	@./node_modules/.bin/jshint $^ \

clean:
	rm -fr build components

.PHONY: build, clean, test, lint
