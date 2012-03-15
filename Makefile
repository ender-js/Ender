tests:
	@jshint lib/ test/
	@./node_modules/.bin/buster-test -g unit

functional:
	@jshint lib/ test/
	@./node_modules/.bin/buster-test -g functional
