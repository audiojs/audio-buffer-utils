/**
 * @module  audio-buffer-utils
 */

exports.clone   = clone;
exports.reverse = reverse;
exports.invert  = invert;
exports.zero    = zero;
exports.noise   = noise;


/**
 * Create clone of a buffer
 */
function clone (inBuffer) {
    var outBuffer = inBuffer.context.createBuffer(
        inBuffer.numberOfChannels,
        inBuffer.length,
        inBuffer.sampleRate
    );

    for (var i = 0, c = inBuffer.numberOfChannels; i < c; ++i) {
        var od = outBuffer.getChannelData(i),
            id = inBuffer.getChannelData(i);
        od.set(id, 0);
    }

    return outBuffer;

}


/**
 * Reverse samples in each channel
 */
function reverse (buffer) {
    for (var i = 0, c = buffer.numberOfChannels; i < c; ++i) {
        var d = buffer.getChannelData(i);
        Array.prototype.reverse.call(d);
    }
}


/**
 * Invert amplitude of samples in each channel
 */
function invert (buffer) {
    for (var i = 0, c = buffer.numberOfChannels; i < c; ++i) {
        var d = buffer.getChannelData(i),
            l = buffer.length;
        while (l--) d[l] = -d[l];
    }
}


/**
 * Fill with zeros
 */
function zero (buffer) {
    for (var i = 0, c = buffer.numberOfChannels; i < c; ++i) {
        var d = buffer.getChannelData(i),
            l = buffer.length;
        while (l--) d[l] = 0;
    }
}


/**
 * Fill with white noise
 */
function noise (buffer) {
    for (var i = 0, c = buffer.numberOfChannels; i < c; ++i) {
        var d = buffer.getChannelData(i),
            l = buffer.length;
        while (l--) d[l] = (Math.random() * 2) - 1;
    }
}


/**
 * Generic fill
 */
function fill (buffer, fn) {
     if (!(fn instanceof Function)) {
        var value = fn;
        fn = function (sample, channel, offset) { return value; }
    }

    ndfill(this.data, fn);
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