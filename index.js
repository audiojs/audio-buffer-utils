/**
 * @module  audio-buffer-utils
 */


var AudioBuffer = require('audio-buffer');


module.exports = {
    clone: clone,
    reverse: reverse,
    invert: invert,
    zero: zero,
    noise: noise,
    equal: equal,
    fill: fill
};


/**
 * Create clone of a buffer
 */
function clone (inBuffer) {
    //NOTE: default implementation didn’t work, as buffers do not have context param
    return new AudioBuffer(inBuffer);
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
function invert (buffer) {
    return fill(buffer, function (sample) { return -sample; });
}


/**
 * Fill with zeros
 */
function zero (buffer) {
    return fill(buffer, 0);
}


/**
 * Fill with white noise
 */
function noise (buffer) {
    return fill(buffer, function (sample) { return Math.random() * 2 - 1; });
}


/**
 * Test whether two buffers are the same
 */
function equal (bufferA, bufferB) {
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
 * Generic fill
 */
function fill (buffer, fn) {
    var isFn = fn instanceof Function;

    for (var channel = 0, c = buffer.numberOfChannels; channel < c; ++channel) {
        var data = buffer.getChannelData(channel),
            l = buffer.length;
        if (isFn) {
            for (var i = 0; i < l; i++) {
                data[i] = fn.call(buffer, data[i], channel, i, data);
            }
        }
        else while (l--) data[l] = fn;
    }

    return buffer;
}


/**
 * Return sliced buffer
 */
function slice (buffer, start, end) {
    xxx
}


/**
 * Return new buffer, mapped by a function
 */
function map (buffer, fn) {
    //WISHES: itd be nice to be able to mix channels, apply effects (basically operator processors)
    xxx
}


/**
 * Concat buffer with other buffer
 */
function concat (buffer, other, third, etc) {
    xxx
}


/**
 * Change channels number and upmix/downmix
 */
function channels (buffer, number, upmix) {
    xxx
}


/**
 * Change the duration of the buffer, by trimming or filling with zeros
 */
function duration (buffer, dur) {
    xxx
}


/**
 * Change sample rate
 */
function resample (buffer, sampleRate) {
    xxx
}


/**
 * Shift content of the buffer
 */
function shift (buffer, offset, circular) {
    xxx
}


/**
 * Stretch or slow down the signal by the factor
 */
function scale (buffer, factor) {
    xxx
}


/**
 * Get frequencies content of the buffer
 */
function fft (buffer) {
    xxx
}

/**
 * Get buffer from frequencies content
 */
function ifft (buffer) {
    xxx
}


/**
 * Reduce buffer to a single metric, e. g. average, max, min, volume etc
 */
function reduce (buffer, fn) {
    xxx
}


/**
 * Normalize buffer by the maximum value
 */
function normalize (buffer) {
    xxx
}


/**
 * Trim sound (remove zeros from the beginning and the end)
 */
function trim (buffer, level) {
    xxx
}


/**
 * Get the loudness of the buffer, acc to the spec
 * https://tech.ebu.ch/docs/r/r128.pdf
 */
function loudness (buffer) {
    xxx
}


/**
 * Mix current buffer with the other one
 */
function mix (buffer, bufferB) {
   xxx
}


/**
 * Size of a buffer, in megabytes
 */
function size (buffer) {

}