/**
 * @module  audio-buffer-utils
 */

'use strict'

var AudioBuffer = require('audio-buffer')
var isAudioBuffer = require('is-audio-buffer')
var isBrowser = require('is-browser')
var clamp = require('clamp')
var AudioContext = require('audio-context')
var isBuffer = require('is-buffer')
var createBuffer = require('audio-buffer-from')

var isNeg = function (number) {
	return number === 0 && (1 / number) === -Infinity;
};

var nidx = function negIdx (idx, length) {
	return idx == null ? 0 : isNeg(idx) ? length : idx <= -length ? 0 : idx < 0 ? (length + (idx % length)) : Math.min(length, idx);
}

var context

var utils = {
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
	data: data,
	subbuffer: subbuffer,
	repeat: repeat
}

Object.defineProperty(utils, 'context', {
	get: function () {
		if (!context) context = AudioContext()
		return context
	}
})

module.exports = utils

/**
 * Create buffer from any argument.
 * Better constructor than audio-buffer.
 */
function create (src, options, sampleRate) {
	var length, data

	if (typeof options === 'number') {
		options = {channels: options}
	}
	else if (typeof options === 'string') {
		options = {format: options}
	}
	else if (!options) {
		options = {}
	}
	if (sampleRate) {
		options.sampleRate = sampleRate
	}
	options.context = utils.context

	return createBuffer(src, options)
}


/**
 * Copy data from buffer A to buffer B
 */
function copy (from, to, offset) {
	validate(from);
	validate(to);

	offset = offset || 0;

	for (var channel = 0, l = Math.min(from.numberOfChannels, to.numberOfChannels); channel < l; channel++) {
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
		return utils.context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
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
function reverse (buffer, target, start, end) {
	validate(buffer);

	//if target buffer is passed
	if (!isAudioBuffer(target) && target != null) {
		end = start;
		start = target;
		target = null;
	}

	if (target) {
		validate(target);
		copy(buffer, target);
	}
	else {
		target = buffer;
	}

	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);

	for (var i = 0, c = target.numberOfChannels; i < c; ++i) {
		target.getChannelData(i).subarray(start, end).reverse();
	}

	return target;
}


/**
 * Invert amplitude of samples in each channel
 */
function invert (buffer, target, start, end) {
	//if target buffer is passed
	if (!isAudioBuffer(target) && target != null) {
		end = start;
		start = target;
		target = null;
	}

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
		for (var i = 0, l = arguments.length - 1; i < l; i++) {
			if (!equal(arguments[i], arguments[i + 1])) return false;
		}
		return true;
	}

	validate(bufferA);
	validate(bufferB);

	if (bufferA.length !== bufferB.length || bufferA.numberOfChannels !== bufferB.numberOfChannels) return false;

	for (var channel = 0; channel < bufferA.numberOfChannels; channel++) {
		var dataA = bufferA.getChannelData(channel);
		var dataB = bufferB.getChannelData(channel);

		for (var i = 0; i < dataA.length; i++) {
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
		for (var channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			var targetData = target.getChannelData(channel);
			for (var i = start; i < end; i++) {
				targetData[i] = value
			}
		}
	}
	else {
		for (var channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			var data = buffer.getChannelData(channel),
				targetData = target.getChannelData(channel);
			for (var i = start; i < end; i++) {
				targetData[i] = value.call(buffer, data[i], i, channel, data);
			}
		}
	}

	return target;
}

/**
 * Repeat buffer
 */
function repeat (buffer, times) {
	validate(buffer);

	if (!times || times < 0) return new AudioBuffer(null, {length: 0, numberOfChannels: buffer.numberOfChannels, sampleRate: buffer.sampleRate})

	if (times === 1) return buffer

	var bufs = []
	for (var i = 0; i < times; i++) {
		bufs.push(buffer)
	}

	return concat(bufs)
}

/**
 * Return sliced buffer
 */
function slice (buffer, start, end) {
	validate(buffer);

	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);

	var data = [];
	for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
		var channelData = buffer.getChannelData(channel)
		data.push(channelData.slice(start, end));
	}
	return create(data, buffer.numberOfChannels, buffer.sampleRate);
}

/**
 * Create handle for a buffer from subarrays
 */
function subbuffer (buffer, start, end, channels) {
	validate(buffer);

	if (Array.isArray(start)) {
		channels = start
		start = 0;
		end = -0;
	}
	else if (Array.isArray(end)) {
		channels = end
		end = -0;
	}

	if (!Array.isArray(channels)) {
		channels = Array(buffer.numberOfChannels)
		for (var c = 0; c < buffer.numberOfChannels; c++) {
			channels[c] = c
		}
	}

	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);

	var data = [];
	for (var i = 0; i < channels.length; i++) {
		var channel = channels[i]
		var channelData = buffer.getChannelData(channel)
		data.push(channelData.subarray(start, end));
	}

	//null-context buffer covers web-audio-api buffer functions
	var buf = new AudioBuffer(null, {length: 0, sampleRate: buffer.sampleRate, numberOfChannels: buffer.numberOfChannels})

	//FIXME: not reliable hack to replace data. Mb use audio-buffer-list?
	buf.length = data[0].length
	buf._data = null
	buf._channelData = data
	buf.duration = buf.length / buf.sampleRate

	return buf
}

/**
 * Concat buffer with other buffer(s)
 */
function concat () {
	var list = []

	for (var i = 0, l = arguments.length; i < l; i++) {
		var arg = arguments[i]
		if (Array.isArray(arg)) {
			for (var j = 0; j < arg.length; j++) {
				list.push(arg[j])
			}
		}
		else {
			list.push(arg)
		}
	}

	var channels = 1;
	var length = 0;
	//FIXME: there might be required more thoughtful resampling, but now I'm lazy sry :(
	var sampleRate = 0;

	for (var i = 0; i < list.length; i++) {
		var buf = list[i]
		validate(buf)
		length += buf.length
		channels = Math.max(buf.numberOfChannels, channels)
		sampleRate = Math.max(buf.sampleRate, sampleRate)
	}

	var data = [];
	for (var channel = 0; channel < channels; channel++) {
		var channelData = new Float32Array(length), offset = 0

		for (var i = 0; i < list.length; i++) {
			var buf = list[i]
			if (channel < buf.numberOfChannels) {
				channelData.set(buf.getChannelData(channel), offset);
			}
			offset += buf.length
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
	var buffer, length;

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

	for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
		var cData = buffer.getChannelData(channel);
		var srcData = cData.slice();
		for (var i = 0, l = cData.length, idx; i < l; i++) {
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

	for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
		var cData = buffer.getChannelData(channel);
		if (offset > 0) {
			for (var i = cData.length - offset; i--;) {
				cData[i + offset] = cData[i];
			}
		}
		else {
			for (var i = -offset, l = cData.length - offset; i < l; i++) {
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
	var max = 0

	for (var c = 0; c < buffer.numberOfChannels; c++) {
		var data = buffer.getChannelData(c)
		for (var i = start; i < end; i++) {
			max = Math.max(Math.abs(data[i]), max)
		}
	}

	var amp = Math.max(1 / max, 1)

	return fill(buffer, target, function (value, i, ch) {
		return clamp(value * amp, -1, 1)
	}, start, end);
}

/**
 * remove DC offset
 */
function removeStatic (buffer, target, start, end) {
	var means = mean(buffer, start, end)

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

	var result = []

	for (var c = 0; c < buffer.numberOfChannels; c++) {
		var sum = 0
		var data = buffer.getChannelData(c)
		for (var i = start; i < end; i++) {
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

	var start, end;

	if (trimLeft) {
		start = buffer.length;
		//FIXME: replace with indexOF
		for (var channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			var data = buffer.getChannelData(channel);
			for (var i = 0; i < data.length; i++) {
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
		for (var channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			var data = buffer.getChannelData(channel);
			for (var i = data.length - 1; i >= 0; i--) {
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
	var fn = ratio instanceof Function ? ratio : function (a, b) {
		return a * (1 - ratio) + b * ratio;
	};

	if (offset == null) offset = 0;
	else if (offset < 0) offset += bufferA.length;

	for (var channel = 0; channel < bufferA.numberOfChannels; channel++) {
		var aData = bufferA.getChannelData(channel);
		var bData = bufferB.getChannelData(channel);

		for (var i = offset, j = 0; i < bufferA.length && j < bufferB.length; i++, j++) {
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
	for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
		if (ArrayBuffer.isView(data[channel])) {
			data[channel].set(buffer.getChannelData(channel));
		}
		else {
			data[channel] = buffer.getChannelData(channel);
		}
	}

	return data;
}
