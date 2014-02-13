test:
	bash ./resources/scripts/test.sh
	./node_modules/.bin/mocha --timeout 5000

install:
	bash ./resources/scripts/install.sh

init:
	bash ./resources/scripts/init.sh

index:
	bash ./resources/scripts/indexing/index.sh

clean:
	rm -rf ./resources/data
	rm -rf ./resources/sources
	rm -rf ./node_modules

.PHONY: test

