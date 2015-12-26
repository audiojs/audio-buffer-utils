Utility functions for Audio Buffers.


## Usage

`$ npm install audio-buffer-utils`


```js
var utils = require('audio-buffer-utils');

//Create a new buffer with the same characteristics as `buffer`,
//contents are undefined.
utils.makeCompatible(buffer);

//Create a new buffer with the same characteristics as `buffer`,
//fill it with a copy of `buffer`'s data, and return it.
utils.clone(buffer);

//Reverse `buffer`. `buffer` is modified in-place.
utils.reverse(buffer);

//Invert `buffer`. `buffer` is modified in-place.
utils.invert(buffer);

//Zero all of `buffer`'s channel data. `buffer` is modified in-place.
utils.zero(buffer);

//Fill `buffer` with random data. `buffer` is modified in-place.
utils.noise(buffer);

//Test whether the content of N buffers is the same.
utils.equal(bufferA, bufferB, ...);

//Fill `buffer` with provided function or value. Pass optional `start` and `end` indexes.
utils.fill(buffer, value|function (sample, channel, idx) {
	return sample / 2;
}, start?, end?);

//Create a new buffer by mapping the samples of the current one.
utils.map(buffer, function (sample, channel, idx) {
	return sample / 2;
});

//Create a new buffer by slicing the current one.
utils.slice(buffer, start?, end?);

//Create a new buffer by concatting passed buffers.
//Channels are extended to the buffer with maximum number.
//Sample rate is changed to the maximum within the buffers.
utils.concat(buffer1, buffer2, buffer3, ...);

//Return new buffer based on the passed one, with shortened/extended length.
//Initial data is whether sliced or filled with zeros.
//Useful to change duration: `util.resize(buffer, duration * buffer.sampleRate);`
utils.resize(buffer, length);

//Shift signal in the time domain by `offset` samples, filling with zeros. `buffer` is modified in-place.
utils.shift(buffer, offset);

//Shift signal in the time domain by `offset` samples, in circular fashion. `buffer` is modified in-place.
utils.rotate(buffer, offset);

//Fold buffer into a single value. Useful to generate metrics, like loudness, average, etc.
utils.reduce(buffer, function (previousValue, currendValue, channel, idx, channelData) {
	return previousValue + currentValue;
}, startValue?);

//Normalize buffer by the max value, limit to the -1..+1 range. Modifiers buffer in place.
utils.normalize(buffer, start?, end?);

//Create buffer with trimmed zeros from the beginning/end, by the threshold.
utils.trim(buffer, limit?);
```


## Related

> [audio-buffer](https://github.com/audio-lab/buffer) — audio data container, both for node/browser.<br/>
> [pcm-util](https://github.com/audio-lab/pcm-util) — utils for low-level pcm buffers, like audio formats etc.<br/>
