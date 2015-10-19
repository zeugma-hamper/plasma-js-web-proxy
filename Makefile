# To build:                     make build
# To build debian package:      make package
# To grab stashed node_modules  make modules # or do: npm install
# To remove node_modules:       make clean

.PHONY: all build modules package clean

MODULES = node_modules

all: build

build: modules
	npm run build

modules: $(MODULES)

$(MODULES):
	scp -r git.oblong.com:/ob/buildtools/src-mirrors/plasma-web-proxy/node_modules.tar.gz .
	rm -rf node_modules && tar xzf node_modules.tar.gz

package:
	debuild -b -uc -us -kbuildtools@oblong.com

clean:
	rm -rf $(MODULES)*

# end of file
