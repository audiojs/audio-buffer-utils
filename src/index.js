/**
 * @module  audio-buffer-utils
 */

'use strict'

require('typedarray-methods')
const AudioBuffer = require('audio-buffer')
const isAudioBuffer = require('is-audio-buffer')
const isBrowser = require('is-browser')
const nidx = require('negative-index')
const clamp = require('clamp')

module.exports = {
	create: create,
	copy: copy,
	shallow: shallow,
	clone: clone,
	reverse: reverse,
	invert: invert,
	zero: zero,
	noise: noise,
	equal: equal,
	fill: fill,
	slice: slice,
	map: map,
	concat: concat,
	resize: resize,
	pad: pad,
	padLeft: padLeft,
	padRight: padRight,
	rotate: rotate,
	shift: shift,
	normalize: normalize,
	removeStatic: removeStatic,
	trim: trim,
	trimLeft: trimLeft,
	trimRight: trimRight,
	mix: mix,
	size: size,
	data: data
}


/**
 * Create buffer from any argument
 */
function create (len, channels, rate) {
	return new AudioBuffer(channels, len, rate);
}


/**
 * Copy data from buffer A to buffer B
 */
function copy (from, to, offset) {
	validate(from);
	validate(to);

	offset = offset || 0;

	for (let channel = 0, l = Math.min(from.numberOfChannels, to.numberOfChannels); channel < l; channel++) {
		to.getChannelData(channel).set(from.getChannelData(channel), offset);
	}

	return to;
}


/**
 * Assert argument is AudioBuffer, throw error otherwise.
 */
function validate (buffer) {
	if (!isAudioBuffer(buffer)) throw new Error('Argument should be an AudioBuffer instance.');
}



/**
 * Create a buffer with the same characteristics as inBuffer, without copying
 * the data. Contents of resulting buffer are undefined.
 */
function shallow (buffer) {
	validate(buffer);

	//workaround for faster browser creation
	//avoid extra checks & copying inside of AudioBuffer class
	if (isBrowser) {
		return AudioBuffer.context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
	}

	return create(buffer.length, buffer.numberOfChannels, buffer.sampleRate);
}


/**
 * Create clone of a buffer
 */
function clone (buffer) {
	return copy(buffer, shallow(buffer));
}


/**
 * Reverse samples in each channel
 */
function reverse (buffer, target) {
	validate(buffer);

	if (target) {
		validate(target);
		copy(buffer, target);
	}
	else {
		target = buffer;
	}

	for (let i = 0, c = target.numberOfChannels; i < c; ++i) {
		target.getChannelData(i).reverse();
	}

	return target;
}


/**
 * Invert amplitude of samples in each channel
 */
function invert (buffer, target, start, end) {
	return fill(buffer, target, function (sample) { return -sample; }, start, end);
}


/**
 * Fill with zeros
 */
function zero (buffer, target, start, end) {
	return fill(buffer, target, 0, start, end);
}


/**
 * Fill with white noise
 */
function noise (buffer, target, start, end) {
	return fill(buffer, target, function (sample) { return Math.random() * 2 - 1; }, start, end);
}


/**
 * Test whether two buffers are the same
 */
function equal (bufferA, bufferB) {
	//walk by all the arguments
	if (arguments.length > 2) {
		for (let i = 0, l = arguments.length - 1; i < l; i++) {
			if (!equal(arguments[i], arguments[i + 1])) return false;
		}
		return true;
	}

	validate(bufferA);
	validate(bufferB);

	if (bufferA.length !== bufferB.length || bufferA.numberOfChannels !== bufferB.numberOfChannels) return false;

	for (let channel = 0; channel < bufferA.numberOfChannels; channel++) {
		let dataA = bufferA.getChannelData(channel);
		let dataB = bufferB.getChannelData(channel);

		for (let i = 0; i < dataA.length; i++) {
			if (dataA[i] !== dataB[i]) return false;
		}
	}

	return true;
}



/**
 * Generic in-place fill/transform
 */
function fill (buffer, target, value, start, end) {
	validate(buffer);

	//if target buffer is passed
	if (!isAudioBuffer(target) && target != null) {
		//target is bad argument
		if (typeof value == 'function') {
			target = null;
		}
		else {
			end = start;
			start = value;
			value = target;
			target = null;
		}
	}

	if (target) {
		validate(target);
	}
	else {
		target = buffer;
	}

	//resolve optional start/end args
	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);

	//resolve type of value
	if (!(value instanceof Function)) {
		for (let channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			let targetData = target.getChannelData(channel);
			for (let i = start; i < end; i++) {
				targetData[i] = value
			}
		}
	}
	else {
		for (let channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			let data = buffer.getChannelData(channel),
				targetData = target.getChannelData(channel);
			for (let i = start; i < end; i++) {
				targetData[i] = value.call(buffer, data[i], i, channel, data);
			}
		}
	}


	return target;
}


/**
 * Return sliced buffer
 */
function slice (buffer, start, end) {
	validate(buffer);

	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);

	let data = [];
	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		data.push(buffer.getChannelData(channel).slice(start, end));
	}
	return create(data, buffer.numberOfChannels, buffer.sampleRate);
}


/**
 * Return new buffer, mapped by a function.
 * Similar to transform, but keeps initial buffer untouched
 */
function map (buffer, fn) {
	validate(buffer);

	let data = [];

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		data.push(buffer.getChannelData(channel).map(function (value, idx) {
			return fn.call(buffer, value, idx, channel, data);
		}));
	}

	return create(data, buffer.numberOfChannels, buffer.sampleRate);
}


/**
 * Concat buffer with other buffer(s)
 */
function concat (bufferA, bufferB) {
	//walk by all the arguments
	if (arguments.length > 2) {
		let result = bufferA;
		for (let i = 1, l = arguments.length; i < l; i++) {
			result = concat(result, arguments[i]);
		}
		return result;
	}

	validate(bufferA);
	validate(bufferB);

	let data = [];
	let channels = Math.max(bufferA.numberOfChannels, bufferB.numberOfChannels);
	let length = bufferA.length + bufferB.length;

	//FIXME: there might be required more thoughtful resampling, but now I'm lazy sry :(
	let sampleRate = Math.max(bufferA.sampleRate, bufferB.sampleRate);

	for (let channel = 0; channel < channels; channel++) {
		let channelData = new Float32Array(length);

		if (channel < bufferA.numberOfChannels) {
			channelData.set(bufferA.getChannelData(channel));
		}

		if (channel < bufferB.numberOfChannels) {
			channelData.set(bufferB.getChannelData(channel), bufferA.length);
		}

		data.push(channelData);
	}

	return create(data, channels, sampleRate);
}


/**
 * Change the length of the buffer, by trimming or filling with zeros
 */
function resize (buffer, length) {
	validate(buffer);

	if (length < buffer.length) return slice(buffer, 0, length);

	return concat(buffer, create(length - buffer.length, buffer.numberOfChannels));
}


/**
 * Pad buffer to required size
 */
function pad (a, b, value) {
	let buffer, length;

	if (typeof a === 'number') {
		buffer = b;
		length = a;
	} else {
		buffer = a;
		length = b;
	}

	value = value || 0;

	validate(buffer);

	//no need to pad
	if (length < buffer.length) return buffer;

	//left-pad
	if (buffer === b) {
		return concat(fill(create(length - buffer.length, buffer.numberOfChannels), value), buffer);
	}

	//right-pad
	return concat(buffer, fill(create(length - buffer.length, buffer.numberOfChannels), value));
}
function padLeft (data, len, value) {
	return pad(len, data, value)
}
function padRight (data, len, value) {
	return pad(data, len, value)
}



/**
 * Shift content of the buffer in circular fashion
 */
function rotate (buffer, offset) {
	validate(buffer);

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		let cData = buffer.getChannelData(channel);
		let srcData = cData.slice();
		for (let i = 0, l = cData.length, idx; i < l; i++) {
			idx = (offset + (offset + i < 0 ? l + i : i )) % l;
			cData[idx] = srcData[i];
		}
	}

	return buffer;
}


/**
 * Shift content of the buffer
 */
function shift (buffer, offset) {
	validate(buffer);

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		let cData = buffer.getChannelData(channel);
		if (offset > 0) {
			for (let i = cData.length - offset; i--;) {
				cData[i + offset] = cData[i];
			}
		}
		else {
			for (let i = -offset, l = cData.length - offset; i < l; i++) {
				cData[i + offset] = cData[i] || 0;
			}
		}
	}

	return buffer;
}


/**
 * Normalize buffer by the maximum value,
 * limit values by the -1..1 range
 */
function normalize (buffer, target, start, end) {
	//resolve optional target arg
	if (!isAudioBuffer(target)) {
		end = start;
		start = target;
		target = null;
	}

	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);

	//for every channel bring it to max-min amplitude range
	let max = 0

	for (let c = 0; c < buffer.numberOfChannels; c++) {
		let data = buffer.getChannelData(c)
		for (let i = start; i < end; i++) {
			max = Math.max(Math.abs(data[i]), max)
		}
	}

	let amp = Math.max(1 / max, 1)

	return fill(buffer, target, function (value, i, ch) {
		return clamp(value * amp, -1, 1)
	}, start, end);
}

/**
 * remove DC offset
 */
function removeStatic (buffer, target, start, end) {
	let means = mean(buffer, start, end)

	return fill(buffer, target, function (value, i, ch) {
		return value - means[ch];
	}, start, end);
}

/**
 * Get average level per-channel
 */
function mean (buffer, start, end) {
	validate(buffer)

	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);

	if (end - start < 1) return []

	let result = []

	for (let c = 0; c < buffer.numberOfChannels; c++) {
		let sum = 0
		let data = buffer.getChannelData(c)
		for (let i = start; i < end; i++) {
			sum += data[i]
		}
		result.push(sum / (end - start))
	}

	return result
}


/**
 * Trim sound (remove zeros from the beginning and the end)
 */
function trim (buffer, level) {
	return trimInternal(buffer, level, true, true);
}

function trimLeft (buffer, level) {
	return trimInternal(buffer, level, true, false);
}

function trimRight (buffer, level) {
	return trimInternal(buffer, level, false, true);
}

function trimInternal(buffer, level, trimLeft, trimRight) {
	validate(buffer);

	level = (level == null) ? 0 : Math.abs(level);

	let start, end;

	if (trimLeft) {
		start = buffer.length;
		//FIXME: replace with indexOF
		for (let channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			let data = buffer.getChannelData(channel);
			for (let i = 0; i < data.length; i++) {
				if (i > start) break;
				if (Math.abs(data[i]) > level) {
					start = i;
					break;
				}
			}
		}
	} else {
		start = 0;
	}

	if (trimRight) {
		end = 0;
		//FIXME: replace with lastIndexOf
		for (let channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			let data = buffer.getChannelData(channel);
			for (let i = data.length - 1; i >= 0; i--) {
				if (i < end) break;
				if (Math.abs(data[i]) > level) {
					end = i + 1;
					break;
				}
			}
		}
	} else {
		end = buffer.length;
	}

	return slice(buffer, start, end);
}


/**
 * Mix current buffer with the other one.
 * The reason to modify bufferA instead of returning the new buffer
 * is reduced amount of calculations and flexibility.
 * If required, the cloning can be done before mixing, which will be the same.
 */
function mix (bufferA, bufferB, ratio, offset) {
	validate(bufferA);
	validate(bufferB);

	if (ratio == null) ratio = 0.5;
	let fn = ratio instanceof Function ? ratio : function (a, b) {
		return a * (1 - ratio) + b * ratio;
	};

	if (offset == null) offset = 0;
	else if (offset < 0) offset += bufferA.length;

	for (let channel = 0; channel < bufferA.numberOfChannels; channel++) {
		let aData = bufferA.getChannelData(channel);
		let bData = bufferB.getChannelData(channel);

		for (let i = offset, j = 0; i < bufferA.length && j < bufferB.length; i++, j++) {
			aData[i] = fn.call(bufferA, aData[i], bData[j], j, channel);
		}
	}

	return bufferA;
}


/**
 * Size of a buffer, in bytes
 */
function size (buffer) {
	validate(buffer);

	return buffer.numberOfChannels * buffer.getChannelData(0).byteLength;
}


/**
 * Return array with buffer’s per-channel data
 */
function data (buffer, data) {
	validate(buffer);

	//ensure output data array, if not defined
	data = data || [];

	//transfer data per-channel
	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		if (ArrayBuffer.isView(data[channel])) {
			data[channel].set(buffer.getChannelData(channel));
		}
		else {
			data[channel] = buffer.getChannelData(channel);
		}
	}

	return data;
}
