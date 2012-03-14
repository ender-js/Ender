tests:
	@jshint lib/ test/
	@./node_modules/.bin/buster-test -g unit

#@buster-test -g unit
