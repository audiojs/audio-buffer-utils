Utility functions for Audio Buffers.


## Usage

[`$ npm install audio-buffer-utils`](https://npmjs.org/package/audio-buffer-utils)


```js
var utils = require('audio-buffer-utils');

//Create a new buffer from any argument.
//Data can be a length, an array with channels' data, an other buffer or plain array.
utils.create(channels?, data, sampleRate?);

//Create a new buffer with the same characteristics as `buffer`,
//contents are undefined.
utils.shallow(buffer);

//Create a new buffer with the same characteristics as `buffer`,
//fill it with a copy of `buffer`'s data, and return it.
utils.clone(buffer);

//Copy the data from one buffer to another, with optional offset
utils.copy(fromBuffer, result, offset?);

//Reverse `buffer`. Place data to `result` buffer, if any, otherwise modify `buffer` in-place.
utils.reverse(buffer, result?);

//Invert `buffer`. Place data to `result` buffer, if any, otherwise modify `buffer` in-place.
utils.invert(buffer, result?);

//Zero all of `buffer`'s channel data. `buffer` is modified in-place.
utils.zero(buffer);

//Fill `buffer` with random data. `buffer` is modified in-place.
utils.noise(buffer);

//Test whether the content of N buffers is the same.
utils.equal(bufferA, bufferB, ...);

//Fill `buffer` with provided function or value.
//Place data to `result` buffer, if any, otherwise modify `buffer` in-place.
//Pass optional `start` and `end` indexes.
utils.fill(buffer, result?, value|function (sample, idx, channel) {
	return sample / 2;
}, start?, end?);

//Create a new buffer by mapping the samples of the current one.
utils.map(buffer, function (sample, idx, channel) {
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

//Right/left-pad buffer to the length, filling with value
utils.pad(buffer, length, value?);
utils.pad(length, buffer, value?);

//Shift signal in the time domain by `offset` samples, filling with zeros.
//Modify `buffer` in-place.
utils.shift(buffer, offset);

//Shift signal in the time domain by `offset` samples, in circular fashion.
//Modify `buffer` in-place.
utils.rotate(buffer, offset);

//Fold buffer into a single value. Useful to generate metrics, like loudness, average, etc.
utils.reduce(buffer, function (previousValue, currendValue, idx, channel, channelData) {
	return previousValue + currentValue;
}, startValue?);

//Normalize buffer by the max value, limit to the -1..+1 range.
//Place data to `result` buffer, if any, otherwise modify `buffer` in-place.
utils.normalize(buffer, result?, start?, end?);

//Create buffer with trimmed zeros from the start and/or end, by the threshold.
utils.trim(buffer, threshold?);
utils.trimStart(buffer, threshold?);
utils.trimEnd(buffer, threshold?)

//Mix second buffer into the first one. Pass optional weight value or mixing function.
util.mix(bufferA, bufferB, ratio|fn(valA, valB, idx, channel)?, offset?);

//Return buffer size, in bytes. Use pretty-bytes package to format bytes to a string, if needed.
utils.size(buffer);

//Get channels' data in array. Pass existing array to transfer the data to it.
//Useful in audio-workers to transfer buffer to output.
utils.data(buffer, data?);
```


## Related

> [audio-buffer](https://github.com/audio-lab/buffer) — audio data container, both for node/browser.<br/>
> [pcm-util](https://github.com/audio-lab/pcm-util) — utils for low-level pcm buffers, like audio formats etc.<br/>
> [scijs](https://github.com/scijs) — DSP utils, like fft, resample, scale etc.
