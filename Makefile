.PHONY: test

test:
	@rm -rf test/node_modules
	@rm -rf test/js
	@npm install > /dev/null
	@cd ./test; node ./test.js;

