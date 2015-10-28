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

## Building

There are 4 useful make targets available:

make modules # copies and installs node modules from git.oblong.com

make build # simply runs: npm run build

make package # creates debian package

make clean # Removes npm modules
