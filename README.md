# audio-buffer-utils [![Build Status](https://travis-ci.org/audiojs/audio-buffer-utils.svg?branch=master)](https://travis-ci.org/audiojs/audio-buffer-utils) [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Utility functions for [_AudioBuffers_](https://github.com/audiojs/audio-buffer) in web-audio and node. Optimized for performance.

## Usage

[![npm install audio-buffer-utils](https://nodei.co/npm/audio-buffer-utils.png?mini=true)](https://npmjs.org/package/audio-buffer-utils/)

### `const util = require('audio-buffer-utils')`
Get utils toolset.

_AudioBuffer_ data layout is considered horizontal, in that samples are arranged horizontally and channels vertically. Functions arguments take sample index first and channel index second.

Sample values range from `-1` to `1`, but not limited to it.

### `util.create(data|length, channels = 2, sampleRate?)`
Create a new buffer from any argument.
Data can be a length, an array with channels' data, an other buffer or plain array.

```js
//mono buffer with 100 samples
let a = util.create(100, 1)

//stereo buffer with predefined channels data
let b = util.create([Array(100).fill(0.5), Array(100).fill(0.4)])

//minimal length buffer (1 sample, 2 channels)
let c = util.create()

//create 2 seconds buffer with reduced sample rate
let rate = 22050
let d = util.create(2 * rate, 2, rate)
```

### `util.shallow(buffer)`
Create a new buffer with the same characteristics as `buffer`, contents are undefined.

```js
//create buffer with the same shape as `a`
let b = util.shallow(a)

util.equal(a, b) //false
```

### `util.clone(buffer)`
Create a new buffer with the same characteristics as `buffer`, fill it with a copy of `buffer`'s data, and return it.

```js
//clone buffer `a`
let b = util.clone(a)

util.equal(a, b) //true
```

### `util.copy(fromBuffer, toBuffer, offset?)`
Copy the data from one buffer to another, with optional offset.

### `util.reverse(buffer, target?)`
Reverse `buffer`. Place data to `target` buffer, if any, otherwise modify `buffer` in-place.

### `util.invert(buffer, target?)`
Invert `buffer`. Place data to `target` buffer, if any, otherwise modify `buffer` in-place.

### `util.zero(buffer)`
Zero all of `buffer`'s channel data. `buffer` is modified in-place.

### `util.noise(buffer)`
Fill `buffer` with random data. `buffer` is modified in-place.

### `util.equal(bufferA, bufferB, ...)`
Test whether the content of N buffers is the same.

```js
let a = util.create(1024, 2)
util.noise(a)
let b = util.clone(a)
let c = util.shallow(a)
util.copy(a, c)

if (util.equal(a, b, c)) {
	//true
}
```

### `util.fill(buffer, target?, value|(sample, i, channel) => sample, start = 0, end = -0)`
Fill `buffer` with provided function or value.
Place data to `target` buffer, if any, otherwise modify `buffer` in-place.
Pass optional `start` and `end` indexes.

```js
let frequency = 440, rate = 44100

//create 2 seconds buffer
let a = util.create(2 * rate)

//populate with 440hz sine wave
util.fill(a, (value, i, channel) => Math.sin(Math.PI * 2 * frequency * i / rate))
```

### `util.map(buffer, (sample, i, channel) => newSample )`
Create a new buffer by mapping the samples of the current one.

```js
//append second harmonic to buffer `a`
let b = util.map(a, (value, i, channel) => value + Math.sin(Math.PI * 2 * (frequency * 2) * i / rate))
```

### `util.slice(buffer, start = 0, end = -0)`
Create a new buffer by slicing the current one.

### `util.concat(buffer1, buffer2, buffer3, ...)`
Create a new buffer by concatting passed buffers.
Channels are extended to the buffer with maximum number.
Sample rate is changed to the maximum within the buffers.

### `util.resize(buffer, length)`
Return new buffer based on the passed one, with shortened/extended length.
Initial data is whether sliced or filled with zeros. Combines `util.pad` and `util.slice`.

```js
//change duration to 2s
let b = util.resize(a, 2 * a.sampleRate)
```

### `util.pad(buffer|length, length|buffer, value?)`
### `util.padLeft(buffer, length, value?)`
### `util.padRight(buffer, length, value?)`
Right/left-pad buffer to the length, filling with value.

```js
let buf = util.create(3, 1)
util.fill(buf, .2)

util.pad(buf, 5) // [.2,.2,.2, 0,0]
util.pad(5, buf) // [0,0, .2,.2,.2]
util.pad(buf, 5, .1) // [.2,.2,.2, .1,.1]
util.pad(5, buf, .1) // [.1,.1, .2,.2,.2]
```

### `util.shift(buffer, offset)`
Shift signal in the time domain by `offset` samples, filling with zeros.
Modify `buffer` in-place.

### `util.rotate(buffer, offset)`
Shift signal in the time domain by `offset` samples, in circular fashion.
Modify `buffer` in-place.

### `util.normalize(buffer, target?, start = 0, end = -0)`
Normalize buffer by the amplitude, bring to -1..+1 range. Channel amplitudes ratio will be preserved. You may want to remove static level beforehead, because normalization preserves zero static level. Note that it is not the same as [array-normalize](https://github.com/dfcreative/array-noramalize).
Places data to `target` buffer, if any, otherwise modifies `buffer` in-place.

```js
const AudioBuffer = require('audio-buffer')
const util = require('audio-buffer-utils')

let buf = AudioBuffer(1, [0, 0.2, 0, -0.4]);
util.normalize(buf);
buf.getChannelData(0) // [0, .5, 0, -1]
```

### `util.removeStatic(buffer, target?, start = 0, end = -0)`
Remove DC (Direct Current) offset from the signal, i.e. remove static level, that is bring mean to zero. DC offset will be reduced for every channel independently.

```js
var a = AudioBuffer(2, [.5,.7,.3,.5])

util.removeStatic(a)

a.getChannelData(0) // [-.1, .1]
a.getChannelData(1) // [-.1, .1]
```

### `util.trim(buffer, threshold = 0)`
### `util.trimLeft(buffer, threshold = 0)`
### `util.trimRight(buffer, threshold = 0)`
Create buffer with trimmed zeros from the start and/or end, by the threshold amplitude.

### `util.mix(bufferA, bufferB, ratio|(valA, valB, i, channel) => val?, offset = 0)`
Mix second buffer into the first one. Pass optional weight value or mixing function.

### `util.size(buffer)`
Return buffer size, in bytes. Use [pretty-bytes](https://npmjs.org/package/pretty-bytes) package to format bytes to a string, if needed.

### `util.data(buffer, data?)`
Get channels' data in array. Pass existing array to transfer the data to it.
Useful in audio-workers to transfer buffer to output.

```js
let a = util.create(3, 2)

let audioData = util.data(a) // [[0,0,0], [0,0,0]]
```

## Related

> [audio-buffer](https://github.com/audio-lab/buffer) — audio data container, both for node/browser.<br/>

## Credits

Thanks to [**@jaz303**](https://github.com/jaz303/) for [the initial idea](https://github.com/jaz303/audio-buffer-utils) and collaboration.
