REPORTER ?= dot

build: test
	@./node_modules/.bin/faiton build

test: lint
	@./node_modules/.bin/mocha \
		--reporter $(REPORTER)

lint: ./lib/*.js
	@./node_modules/.bin/jshint $^ \

perf: ./benchmark/perf.js
	@node $^

clean:
	rm -fr build components node_modules

.PHONY: build, clean, test, lint
