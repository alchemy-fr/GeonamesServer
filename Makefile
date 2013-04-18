test:
	bash ./resources/scripts/test.sh
	./node_modules/.bin/mocha --reporter nyan --timeout 5000

install:
	bash ./resources/scripts/install.sh

clean:
	rm ./resources/data
	rm ./resources/sources
	rm ./node_modules

.PHONY: test

