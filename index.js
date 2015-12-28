/**
 * @module  audio-buffer-utils
 */


var AudioBuffer = require('audio-buffer');


module.exports = {
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
    rotate: rotate,
    shift: shift,
    reduce: reduce,
    normalize: normalize,
    trim: trim,
    trimStart: trimStart,
    trimEnd: trimEnd,
    mix: mix,
    size: size
};


/**
 * Create a buffer with the same characteristics as inBuffer, without copying
 * the data. Contents of resulting buffer are undefined.
 */
function shallow (inBuffer) {
    return new AudioBuffer(inBuffer.numberOfChannels, inBuffer.length, inBuffer.sampleRate);
}


/**
 * Create clone of a buffer
 */
function clone (inBuffer) {
    return slice(inBuffer);
}


/**
 * Reverse samples in each channel
 */
function reverse (buffer) {
    for (var i = 0, c = buffer.numberOfChannels; i < c; ++i) {
        var d = buffer.getChannelData(i);
        Array.prototype.reverse.call(d);
    }

    return buffer;
}


/**
 * Invert amplitude of samples in each channel
 */
function invert (buffer, start, end) {
    return fill(buffer, function (sample) { return -sample; }, start, end);
}


/**
 * Fill with zeros
 */
function zero (buffer, start, end) {
    return fill(buffer, 0, start, end);
}


/**
 * Fill with white noise
 */
function noise (buffer, start, end) {
    return fill(buffer, function (sample) { return Math.random() * 2 - 1; }, start, end);
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
function fill (buffer, value, start, end) {
    if (start == null) start = 0;
    else if (start < 0) start += buffer.length;
    if (end == null) end = buffer.length;
    else if (end < 0) end += buffer.length;

    if (!(value instanceof Function)) {
        var fn = function () {return value;};
    }
    else {
        var fn = value;
    }

    for (var channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
        var data = buffer.getChannelData(channel),
            l = buffer.length;
        for (var i = start; i < end; i++) {
            data[i] = fn.call(buffer, data[i], channel, i, data);
        }
    }

    return buffer;
}


/**
 * Return sliced buffer
 */
function slice (buffer, start, end) {
    var data = [];
    for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
        data.push(buffer.getChannelData(channel).slice(start, end));
    }
    return new AudioBuffer(buffer.numberOfChannels, data, buffer.sampleRate);
}


/**
 * Return new buffer, mapped by a function.
 * Similar to transform, but keeps initial buffer untouched
 */
function map (buffer, fn) {
    var data = [];

    for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
        data.push(buffer.getChannelData(channel).map(function (value, idx) {
            return fn.call(buffer, value, channel, idx, data);
        }));
    }

    return new AudioBuffer(buffer.numberOfChannels, data, buffer.sampleRate);
}


/**
 * Concat buffer with other buffer(s)
 */
function concat (bufferA, bufferB) {
    //walk by all the arguments
    if (arguments.length > 2) {
        var result = bufferA;
        for (var i = 1, l = arguments.length; i < l; i++) {
            result = concat(result, arguments[i]);
        }
        return result;
    }

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

    return new AudioBuffer(channels, data, sampleRate);
}


/**
 * Change the length of the buffer, by trimming or filling with zeros
 */
function resize (buffer, length) {
    if (length < buffer.length) return slice(buffer, 0, length);

    return concat(buffer, new AudioBuffer(length - buffer.length));
}



/**
 * Shift content of the buffer in circular fashion
 */
function rotate (buffer, offset) {
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
 * Reduce buffer to a single metric, e. g. average, max, min, volume etc
 */
function reduce (buffer, fn, value, start, end) {
    if (start == null) start = 0;
    else if (start < 0) start += buffer.length;
    if (end == null) end = buffer.length;
    else if (end < 0) end += buffer.length;

    if (value == null) value = 0;

    for (var channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
        var data = buffer.getChannelData(channel),
            l = buffer.length;
        for (var i = start; i < end; i++) {
            value = fn.call(buffer, value, data[i], channel, i, data);
        }
    }

    return value;
}


/**
 * Normalize buffer by the maximum value,
 * limit values by the -1..1 range
 */
function normalize (buffer, start, end) {
    var max = reduce(buffer, function (prev, curr) {
        return Math.max(Math.abs(prev), Math.abs(curr));
    }, 0, start, end);

    var amp = 1 / Math.min(max, 1);

    return fill(buffer, function (value) {
        return Math.min(value * amp, 1);
    }, start, end);
}


/**
 * Trim sound (remove zeros from the beginning and the end)
 */
function trim (buffer, level) {
    return trimInternal(buffer, level, true, true);
}

function trimStart (buffer, level) {
    return trimInternal(buffer, level, true, false);
}

function trimEnd (buffer, level) {
    return trimInternal(buffer, level, false, true);
}

function trimInternal(buffer, level, trimLeft, trimRight) {
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
function mix (bufferA, bufferB, weight, offset) {
    if (weight == null) weight = 0.5;
    var fn = weight instanceof Function ? weight : function (a, b) {
        return a * (1 - weight) + b * weight;
    };

    if (offset == null) offset = 0;
    else if (offset < 0) offset += bufferA.length;

    for (var channel = 0; channel < bufferA.numberOfChannels; channel++) {
        var aData = bufferA.getChannelData(channel);
        var bData = bufferB.getChannelData(channel);

        for (var i = offset, j = 0; i < bufferA.length && j < bufferB.length; i++, j++) {
            aData[i] = fn.call(bufferA, aData[i], bData[j], channel, j);
        }
    }

    return bufferA;
}


/**
 * Size of a buffer, in bytes
 */
function size (buffer) {
    return buffer.numberOfChannels * buffer.getChannelData(0).byteLength;
}