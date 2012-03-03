tests:
	@jshint lib/ test/
	#@buster-test -g unit
	@node -e 'require("buster-test-cli").cli.test.create().run(process.argv.slice(2));'
