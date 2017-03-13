/**
 * @module  audio-buffer-utils
 */

'use strict';

require('typedarray-methods');
var AudioBuffer = require('audio-buffer');
var isAudioBuffer = require('is-audio-buffer');
var isBrowser = require('is-browser');
var nidx = require('negative-index');
var clamp = require('clamp');

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
};

/**
 * Create buffer from any argument
 */
function create(len, channels, rate) {
	return new AudioBuffer(channels, len, rate);
}

/**
 * Copy data from buffer A to buffer B
 */
function copy(from, to, offset) {
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
function validate(buffer) {
	if (!isAudioBuffer(buffer)) throw new Error('Argument should be an AudioBuffer instance.');
}

/**
 * Create a buffer with the same characteristics as inBuffer, without copying
 * the data. Contents of resulting buffer are undefined.
 */
function shallow(buffer) {
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
function clone(buffer) {
	return copy(buffer, shallow(buffer));
}

/**
 * Reverse samples in each channel
 */
function reverse(buffer, target) {
	validate(buffer);

	if (target) {
		validate(target);
		copy(buffer, target);
	} else {
		target = buffer;
	}

	for (var i = 0, c = target.numberOfChannels; i < c; ++i) {
		target.getChannelData(i).reverse();
	}

	return target;
}

/**
 * Invert amplitude of samples in each channel
 */
function invert(buffer, target, start, end) {
	return fill(buffer, target, function (sample) {
		return -sample;
	}, start, end);
}

/**
 * Fill with zeros
 */
function zero(buffer, target, start, end) {
	return fill(buffer, target, 0, start, end);
}

/**
 * Fill with white noise
 */
function noise(buffer, target, start, end) {
	return fill(buffer, target, function (sample) {
		return Math.random() * 2 - 1;
	}, start, end);
}

/**
 * Test whether two buffers are the same
 */
function equal(bufferA, bufferB) {
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

		for (var _i = 0; _i < dataA.length; _i++) {
			if (dataA[_i] !== dataB[_i]) return false;
		}
	}

	return true;
}

/**
 * Generic in-place fill/transform
 */
function fill(buffer, target, value, start, end) {
	validate(buffer);

	//if target buffer is passed
	if (!isAudioBuffer(target) && target != null) {
		//target is bad argument
		if (typeof value == 'function') {
			target = null;
		} else {
			end = start;
			start = value;
			value = target;
			target = null;
		}
	}

	if (target) {
		validate(target);
	} else {
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
				targetData[i] = value;
			}
		}
	} else {
		for (var _channel = 0, _c = buffer.numberOfChannels; _channel < _c; _channel++) {
			var _data = buffer.getChannelData(_channel),
			    _targetData = target.getChannelData(_channel);
			for (var _i2 = start; _i2 < end; _i2++) {
				_targetData[_i2] = value.call(buffer, _data[_i2], _i2, _channel, _data);
			}
		}
	}

	return target;
}

/**
 * Return sliced buffer
 */
function slice(buffer, start, end) {
	validate(buffer);

	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);

	var data = [];
	for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
		data.push(buffer.getChannelData(channel).slice(start, end));
	}
	return create(data, buffer.numberOfChannels, buffer.sampleRate);
}

/**
 * Return new buffer, mapped by a function.
 * Similar to transform, but keeps initial buffer untouched
 */
function map(buffer, fn) {
	validate(buffer);

	var data = [];

	var _loop = function _loop(channel) {
		data.push(buffer.getChannelData(channel).map(function (value, idx) {
			return fn.call(buffer, value, idx, channel, data);
		}));
	};

	for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
		_loop(channel);
	}

	return create(data, buffer.numberOfChannels, buffer.sampleRate);
}

/**
 * Concat buffer with other buffer(s)
 */
function concat(bufferA, bufferB) {
	//walk by all the arguments
	if (arguments.length > 2) {
		var result = bufferA;
		for (var i = 1, l = arguments.length; i < l; i++) {
			result = concat(result, arguments[i]);
		}
		return result;
	}

	validate(bufferA);
	validate(bufferB);

	var data = [];
	var channels = Math.max(bufferA.numberOfChannels, bufferB.numberOfChannels);
	var length = bufferA.length + bufferB.length;

	//FIXME: there might be required more thoughtful resampling, but now I'm lazy sry :(
	var sampleRate = Math.max(bufferA.sampleRate, bufferB.sampleRate);

	for (var channel = 0; channel < channels; channel++) {
		var channelData = new Float32Array(length);

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
function resize(buffer, length) {
	validate(buffer);

	if (length < buffer.length) return slice(buffer, 0, length);

	return concat(buffer, create(length - buffer.length, buffer.numberOfChannels));
}

/**
 * Pad buffer to required size
 */
function pad(a, b, value) {
	var buffer = void 0,
	    length = void 0;

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
function padLeft(data, len, value) {
	return pad(len, data, value);
}
function padRight(data, len, value) {
	return pad(data, len, value);
}

/**
 * Shift content of the buffer in circular fashion
 */
function rotate(buffer, offset) {
	validate(buffer);

	for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
		var cData = buffer.getChannelData(channel);
		var srcData = cData.slice();
		for (var i = 0, l = cData.length, idx; i < l; i++) {
			idx = (offset + (offset + i < 0 ? l + i : i)) % l;
			cData[idx] = srcData[i];
		}
	}

	return buffer;
}

/**
 * Shift content of the buffer
 */
function shift(buffer, offset) {
	validate(buffer);

	for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
		var cData = buffer.getChannelData(channel);
		if (offset > 0) {
			for (var i = cData.length - offset; i--;) {
				cData[i + offset] = cData[i];
			}
		} else {
			for (var _i3 = -offset, l = cData.length - offset; _i3 < l; _i3++) {
				cData[_i3 + offset] = cData[_i3] || 0;
			}
		}
	}

	return buffer;
}

/**
 * Normalize buffer by the maximum value,
 * limit values by the -1..1 range
 */
function normalize(buffer, target, start, end) {
	//resolve optional target arg
	if (!isAudioBuffer(target)) {
		end = start;
		start = target;
		target = null;
	}

	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);

	//for every channel bring it to max-min amplitude range
	var max = 0;

	for (var c = 0; c < buffer.numberOfChannels; c++) {
		var _data2 = buffer.getChannelData(c);
		for (var i = start; i < end; i++) {
			max = Math.max(Math.abs(_data2[i]), max);
		}
	}

	var amp = Math.max(1 / max, 1);

	return fill(buffer, target, function (value, i, ch) {
		return clamp(value * amp, -1, 1);
	}, start, end);
}

/**
 * remove DC offset
 */
function removeStatic(buffer, target, start, end) {
	var means = mean(buffer, start, end);

	return fill(buffer, target, function (value, i, ch) {
		return value - means[ch];
	}, start, end);
}

/**
 * Get average level per-channel
 */
function mean(buffer, start, end) {
	validate(buffer);

	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);

	if (end - start < 1) return [];

	var result = [];

	for (var c = 0; c < buffer.numberOfChannels; c++) {
		var sum = 0;
		var _data3 = buffer.getChannelData(c);
		for (var i = start; i < end; i++) {
			sum += _data3[i];
		}
		result.push(sum / (end - start));
	}

	return result;
}

/**
 * Trim sound (remove zeros from the beginning and the end)
 */
function trim(buffer, level) {
	return trimInternal(buffer, level, true, true);
}

function trimLeft(buffer, level) {
	return trimInternal(buffer, level, true, false);
}

function trimRight(buffer, level) {
	return trimInternal(buffer, level, false, true);
}

function trimInternal(buffer, level, trimLeft, trimRight) {
	validate(buffer);

	level = level == null ? 0 : Math.abs(level);

	var start = void 0,
	    end = void 0;

	if (trimLeft) {
		start = buffer.length;
		//FIXME: replace with indexOF
		for (var channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			var _data4 = buffer.getChannelData(channel);
			for (var i = 0; i < _data4.length; i++) {
				if (i > start) break;
				if (Math.abs(_data4[i]) > level) {
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
		for (var _channel2 = 0, _c2 = buffer.numberOfChannels; _channel2 < _c2; _channel2++) {
			var _data5 = buffer.getChannelData(_channel2);
			for (var _i4 = _data5.length - 1; _i4 >= 0; _i4--) {
				if (_i4 < end) break;
				if (Math.abs(_data5[_i4]) > level) {
					end = _i4 + 1;
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
function mix(bufferA, bufferB, ratio, offset) {
	validate(bufferA);
	validate(bufferB);

	if (ratio == null) ratio = 0.5;
	var fn = ratio instanceof Function ? ratio : function (a, b) {
		return a * (1 - ratio) + b * ratio;
	};

	if (offset == null) offset = 0;else if (offset < 0) offset += bufferA.length;

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
function size(buffer) {
	validate(buffer);

	return buffer.numberOfChannels * buffer.getChannelData(0).byteLength;
}

/**
 * Return array with buffer’s per-channel data
 */
function data(buffer, data) {
	validate(buffer);

	//ensure output data array, if not defined
	data = data || [];

	//transfer data per-channel
	for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
		if (ArrayBuffer.isView(data[channel])) {
			data[channel].set(buffer.getChannelData(channel));
		} else {
			data[channel] = buffer.getChannelData(channel);
		}
	}

	return data;
}