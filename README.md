# audio-buffer-utils [![Build Status](https://travis-ci.org/audiojs/audio-buffer-utils.svg?branch=master)](https://travis-ci.org/audiojs/audio-buffer-utils) [![unstable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Utility functions for [_AudioBuffers_](https://github.com/audiojs/audio-buffer) in web-audio and node.

## Usage

[![npm install audio-buffer-utils](https://nodei.co/npm/audio-buffer-utils.png?mini=true)](https://npmjs.org/package/audio-buffer-utils/)

### `const utils = require('audio-buffer-utils')`
Get utils toolset.

_AudioBuffer_ data layout is considered horizontal, in that sample numbers are arranged horizontally, channels vertically, and functions take sample index as the first and number of channel as the second arguments.

Sample values range from `-1` to `1`, but not limited to it.

### `utils.create(data|length, channels = 2, sampleRate?)`
Create a new buffer from any argument.
Data can be a length, an array with channels' data, an other buffer or plain array.

```js
//mono buffer with 100 samples
let a = utils.create(100, 1)

//stereo buffer with predefined channels data
let b = utils.create([Array(100).fill(0.5), Array(100).fill(0.4)])

//minimal length buffer (1 sample, 2 channels)
let c = utils.create()
```

### `utils.shallow(buffer)`
Create a new buffer with the same characteristics as `buffer`, contents are undefined.

### `utils.clone(buffer)`
Create a new buffer with the same characteristics as `buffer`, fill it with a copy of `buffer`'s data, and return it.

### `utils.copy(fromBuffer, result, offset?)`
Copy the data from one buffer to another, with optional offset.

### `utils.reverse(buffer, result?)`
Reverse `buffer`. Place data to `result` buffer, if any, otherwise modify `buffer` in-place.

### `utils.invert(buffer, result?)`
Invert `buffer`. Place data to `result` buffer, if any, otherwise modify `buffer` in-place.

### `utils.zero(buffer)`
Zero all of `buffer`'s channel data. `buffer` is modified in-place.

### `utils.noise(buffer)`
Fill `buffer` with random data. `buffer` is modified in-place.

### `utils.equal(bufferA, bufferB, ...)`
Test whether the content of N buffers is the same.

### `utils.fill(buffer, result?, value|(sample, i, channel) => sample, start?, end?)`
Fill `buffer` with provided function or value.
Place data to `result` buffer, if any, otherwise modify `buffer` in-place.
Pass optional `start` and `end` indexes.

### `utils.map(buffer, (sample, i, channel) => newSample )`
Create a new buffer by mapping the samples of the current one.

### `utils.slice(buffer, start?, end?)`
Create a new buffer by slicing the current one.

### `utils.concat(buffer1, buffer2, buffer3, ...)`
Create a new buffer by concatting passed buffers.
Channels are extended to the buffer with maximum number.
Sample rate is changed to the maximum within the buffers.

### `utils.resize(buffer, length)`
Return new buffer based on the passed one, with shortened/extended length.
Initial data is whether sliced or filled with zeros.
Useful to change duration: `util.resize(buffer, duration * buffer.sampleRate)`

### `utils.pad(buffer|length, length|buffer, value?)`
### `utils.padLeft(buffer, length, value?)`
### `utils.padRight(buffer, length, value?)`
Right/left-pad buffer to the length, filling with value.

```js
let buf = util.create(1, 3)
util.fill(buf, .2)

util.pad(buf, 5) // [.2,.2,.2, 0,0]
util.pad(5, buf) // [0,0, .2,.2,.2]
util.pad(buf, 5, .1) // [.2,.2,.2, .1,.1]
util.pad(5, buf, .1) // [.1,.1, .2,.2,.2]
```

### `utils.shift(buffer, offset)`
Shift signal in the time domain by `offset` samples, filling with zeros.
Modify `buffer` in-place.

### `utils.rotate(buffer, offset)`
Shift signal in the time domain by `offset` samples, in circular fashion.
Modify `buffer` in-place.

### `utils.normalize(buffer, result?, start?, end?)`
Normalize buffer by the max value, limit to -1..+1 range. Channels amplitudes ratio will be preserved.
Place data to `result` buffer, if any, otherwise modify `buffer` in-place.

### `utils.removeStatic(buffer, result?, start?, end?)`
Remove DC (Direct Current) offset from the signal, i.e. remove static level, that is bring mean to zero. DC offset will be reduced for every channel independently.

### `utils.trim(buffer, threshold?)`
### `utils.trimLeft(buffer, threshold?)`
### `utils.trimRight(buffer, threshold?)`
Create buffer with trimmed zeros from the start and/or end, by the threshold.

### `util.mix(bufferA, bufferB, ratio|(valA, valB, i, channel) => val?, offset?)`
Mix second buffer into the first one. Pass optional weight value or mixing function.

### `utils.size(buffer)`
Return buffer size, in bytes. Use [pretty-bytes](https://npmjs.org/package/pretty-bytes) package to format bytes to a string, if needed.

### `utils.data(buffer, data?)`
Get channels' data in array. Pass existing array to transfer the data to it.
Useful in audio-workers to transfer buffer to output.


## Related

> [audio-buffer](https://github.com/audio-lab/buffer) — audio data container, both for node/browser.<br/>
> [pcm-util](https://github.com/audio-lab/pcm-util) — utils for low-level pcm buffers, like audio formats etc.<br/>
> [scijs](https://github.com/scijs) — DSP utils, like fft, resample, scale etc.
