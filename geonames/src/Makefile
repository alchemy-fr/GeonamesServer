test:
	bash /var/scripts/test.sh
	./node_modules/.bin/mocha --timeout 5000

install:
	composer install --prefer-source
	/usr/bin/env npm install

init:
	bash /var/scripts/init.sh

index:
	bash /var/scripts/indexing/index.sh

clean:
	rm -rf /data
	rm -rf /sources
	rm -rf ./node_modules

.PHONY: test

