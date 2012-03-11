tests:
	@jshint lib/ test/
	@./node_modules/.bin/buster test

#@buster-test -g unit
