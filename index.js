exports.clone   = clone;
exports.reverse = reverse;
exports.invert  = invert;
exports.zero    = zero;
exports.noise   = noise;

function clone(inBuffer) {
    
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

function reverse(buffer) {
    for (var i = 0, c = buffer.numberOfChannels; i < c; ++i) {
        var d = buffer.getChannelData(i);
        Array.prototype.reverse.call(d);
    }
}

function invert(buffer) {
    for (var i = 0, c = buffer.numberOfChannels; i < c; ++i) {
        var d = buffer.getChannelData(i),
            l = buffer.length;
        while (l--) d[l] = -d[l];
    }
}

function zero(buffer) {
    for (var i = 0, c = buffer.numberOfChannels; i < c; ++i) {
        var d = buffer.getChannelData(i),
            l = buffer.length;
        while (l--) d[l] = 0;
    }
}

function noise(buffer) {
    for (var i = 0, c = buffer.numberOfChannels; i < c; ++i) {
        var d = buffer.getChannelData(i),
            l = buffer.length;
        while (l--) d[l] = (Math.random() * 2) - 1;
    }
}