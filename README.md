# Plasma Web Proxy

Plasma Web Proxy exposes a websocket(ish)-based interface to pool functions,
and provides a client-side Javascript library with a Hose abstraction.

## Usage

Run `server/bin/plasma-web-proxy --port 8000` to start the Plasma Web Proxy
server on port 8000. The javascript library will be available at
`http://localhost/plasma.js` and minified at `http://localhost/plasma.min.js`

## Protocol

See protocol.js.

## Transports

Currently, only [SockJS](https://github.com/sockjs/sockjs-node) clients are
supported, but support for additional transports like vanilla websockets could
be easily added.

## Examples

Ensure the pool "js-test-pool" exists. Then, run these commands to build the
plasma.js script in `public/` and run the proxy server:

    $ npm run build
    $ npm run run-server

And this in another terminal to serve up examples:

    $ npm run serve-examples

Then visit http://localhost:4000/ in your browser to try the examples.

## Building

There are 4 useful make targets available:

make modules # copies and installs node modules from git.oblong.com

make build # simply runs: npm run build

make package # creates debian package

make clean # Removes npm modules

## Maintaining buildbot

Buildbot really, really wants reproducible builds with no disk I/O,
so we cache npm modules manually.  And, annoyingly, because the gelatin
npm module builds against g-speak, the cache is g-speak version specific.

The buildbot tries to keep the cache up to date for you, but if you
change package.json.in, or have run e.g. ob-set-defaults --g-speak 4.6,
you may need to run

    ./buildbot-npm-modules.sh upload

to update it.

You can double check that everything is as buildbot expects
by running: make clean package
