test:
	./node_modules/.bin/mocha --reporter nyan

install:
	sh install.sh

testinstall:
	sh testinstall.sh

clean:
	rm *~

fclean: 
	rm *~
	rm -rf node_modules
	rm -rf docs/build


.PHONY: test

