test:
	@npm install > /dev/null
	@cd ./test; node ./test.js;

.PHONY: test