run-tests:
	@npm install > /dev/null
	@cd ./test/
	@node ./test.js

.PHONY: run-tests