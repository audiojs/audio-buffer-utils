# audio-buffer-utils

Simple utility functions for working with Web Audio API's Buffers.

## Install

Using npm/browserify:

	$ npm install audio-buffer-utils

Or grab a UMD module from `build` directory.

## Require

```javascript
var utils = require('audio-buffer-utils');
```

## API

#### `utils.clone(buffer)`

Creates a new buffer with the same characteristics as `buffer`, fills it with a copy of `buffer`'s data, and returns it.

#### `utils.reverse(buffer)`

Reverse `buffer`; `buffer` is modified in-place.

#### `utils.invert(buffer)`

Invert `buffer`; `buffer` is modified in-place.

#### `utils.zero(buffer)`

Zero all of `buffer`'s channel data; `buffer` is modified in-place.

#### `utils.noise(buffer)`

Fill `buffer` with random data; `buffer` is modified in-place.