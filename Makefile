.PHONY: all build modules package clean

PREFIX ?= /opt/oblong/plasma-web-proxy-gs3.22x
DESTDIR ?= 
ITEMS = client server public node_modules package.json protocol.js README.md
MODULES = node_modules

# To build:                     make build
# To build debian package:      make package
# To grab stashed node_modules  make modules # or do: npm install
# To remove node_modules:       make clean

all: build

install: build $(ITEMS)
	mkdir -p $(DESTDIR)$(PREFIX)
	for i in $(ITEMS) ; do rm -rf $(DESTDIR)$(PREFIX)/$$i ; done
	for i in $(ITEMS) ; do cp -a $$i $(DESTDIR)$(PREFIX)/ ; done

uninstall:
	for i in $(ITEMS) ; do rm -rf $(DESTDIR)$(PREFIX)/$i ; done

build: modules
	npm run build

modules: $(MODULES)

$(MODULES):
	./buildbot-npm-modules.sh download

package:
	debuild -b -uc -us -kbuildtools@oblong.com

clean:
	rm -rf $(MODULES)*

# end of file
