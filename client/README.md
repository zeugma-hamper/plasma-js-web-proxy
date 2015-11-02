Plasma Web Proxy Client
===
A JavaScript library for interacting with the Plasma Web Proxy server.

## Usage
First, start the plasma-web-proxy server. Then, include the Plasma Web Client library in your page. For example, add the following script tag:

```
<script src="http://<host-url:host-port>/plasma.js"></script>
```

It should now be available under the `Plasma` namespace.

## Top-level API

### Plasma.createProxy(`baseUrl`);
Creates and returns a `Proxy` which attempts to connect to
the server at `baseUrl`.

## Proxy

### .createHose(`pool`, `param`, `onReady`)
Creates and returns a `Hose` object. `onReady` is called once the hose has
connected succesfully. Pass `Plasma.WR_ONLY` as `param` to create a
"write-only" hose when you don't need to `await()`.

## Hose

### .deposit(`protein`)
Deposit a protein. `protein` should be a javascript object
with `descrips` array and `ingests` object.

### .await(`callback`)
Run the provided `callback` every time a protein is deposited. The callback
gets the received protein as its sole argument.

### .await(`descrips`, `callback`)
Run the provided `callback` every time a protein is deposited which includes
the `descrips` (which may be singular or an array).

### .awaitOnce(`callback`)
Run the provided `callback` the first time a protein is deposited.

### .awaitOnce(`descrips`, `callback`)
Run the provided `callback` the first time a protein is deposited which
includes the `descrips` (which may be singular or an array).

### .unawait(`callback`)
Deregisters a callback provided to `await()` or `awaitOnce()`.

