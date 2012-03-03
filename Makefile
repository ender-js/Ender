tests:
	@jshint lib/ test/
	@node -e 'require("buster-test-cli").cli.test.create().run(process.argv.slice(2));'

#@buster-test -g unit
