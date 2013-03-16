unittests:
	@node -e "require('colors');console.log('Running unit tests...'.bold.yellow)"
	@./node_modules/.bin/jshint lib/ test/unit/
	@./node_modules/.bin/tap test/unit/*-test.js

functionaltests:
	@node -e "require('colors');console.log('Running functional tests (patience please)...'.bold.yellow)"
	@./node_modules/.bin/jshint lib/ test/functional/
	@./node_modules/.bin/tap test/functional/*-test.js

alltests: unittests functionaltests

contributors:
	git summary | grep -P '^\s+\d' > Contributors