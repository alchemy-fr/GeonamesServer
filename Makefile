test:
	./node_modules/.bin/mocha --reporter nyan --timeout 5000

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

