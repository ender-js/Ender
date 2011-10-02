.PHONY: test

test:
	@rm -rf test/node_modules
	@npm install > /dev/null
	@cd ./test; node ./test.js;

