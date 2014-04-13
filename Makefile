jshint:
	@./node_modules/.bin/jshint lib/
	@./node_modules/.bin/jshint test/

argsparsertests:
	@echo 'Running argsParser tests...'
	@./node_modules/.bin/tap test/args-parser/*-test.js

localpackagetests:
	@echo 'Running LocalPackage tests...'
	@./node_modules/.bin/tap test/local-package/*-test.js

repositorytests:
	@echo 'Running repository tests...'
	@./node_modules/.bin/tap test/repository/*-test.js

installbuildtests:
	@echo 'Running install/build tests...'
	@./node_modules/.bin/tap test/install-build/*-test.js

commandtests:
	@echo 'Running command tests...'
	@./node_modules/.bin/tap test/commands/*-test.js

functionaltests:
	@echo 'Running functional tests (patience please)...'
	@./node_modules/.bin/tap test/functional/*-test.js

alltests: jshint argsparsertests localpackagetests repositorytests installbuildtests commandtests functionaltests

contributors:
	git summary | grep -P '^\s+\d' > Contributors