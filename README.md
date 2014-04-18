# audio-buffer-utils

Simple utility functions for working with Web Audio API's Buffers.

## Install

	$ npm install audio-buffer-utils

Use browserify!

## Require

```javascript
var utils = require('audio-buffer-utils');
```

## API

#### `utils.clone(buffer)`

Creates a new buffer with the same characteristics as `buffer`, fills it with a copy of `buffer`'s data, and returns it.

#### `utils.reverse(buffer)`

Reverse `buffer`. Modifies the buffer in-place.

#### `utils.invert(buffer)`

Invert `buffer`. Modifies the buffer in-place.

#### `utils.zero(buffer)`

Zero all of `buffer`'s channel data. Modifies the buffer in-place.