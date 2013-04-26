test:
	bash ./resources/scripts/test.sh
	./node_modules/.bin/mocha --timeout 5000

install:
	bash ./resources/scripts/install.sh

index:
	bash ./resources/scripts/indexing/index.sh

clean:
	rm ./resources/data
	rm ./resources/sources
	rm ./node_modules

.PHONY: test

