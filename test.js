var test = it;
var util = require('./');
var assert = require('assert');
var AudioBuffer = require('audio-buffer');


test('equal', function () {
	var buf1 = new AudioBuffer([1, 0, -1, 0]);
	var buf2 = new AudioBuffer([1, 0, -1, 0]);
	var buf3 = new AudioBuffer([1, 0, 1, 0]);
	var buf4 = new AudioBuffer([1, 0, 1, 0, 1]); //the last sample is lost
	var buf5 = new AudioBuffer([1, 0, 1, 0]);

	assert(util.equal(buf1, buf2));
	assert(!util.equal(buf1, buf3));
	assert(!util.equal(buf1, buf4));
	assert(util.equal(buf3, buf4));
	assert(util.equal(buf3, buf4, buf5));
	assert(!util.equal(buf4, buf5, buf3, buf1));
});


test('clone', function () {
	var buf1 = new AudioBuffer([1, 0, -1, 0]);
	var buf2 = util.clone(buf1);

	assert(util.equal(buf1, buf2));
	assert.notEqual(buf1, buf2);
});


test('reverse', function () {
	var buf1 = new AudioBuffer([1, 0, -1, 0]);
	util.reverse(buf1);

	assert.deepEqual(buf1.getChannelData(0), [0, 1]);
	assert.deepEqual(buf1.getChannelData(1), [0, -1]);
});


test('invert', function () {
	var buf1 = new AudioBuffer([1, 0.5, -1, 0]);
	util.invert(buf1);

	assert.deepEqual(buf1.getChannelData(0), [-1, -0.5]);
	assert.deepEqual(buf1.getChannelData(1), [1, 0]);
});


test('zero', function () {
	var buf1 = new AudioBuffer([1, 0.5, -1, 0]);
	util.zero(buf1);

	assert.deepEqual(buf1.getChannelData(0), [0, 0]);
	assert.deepEqual(buf1.getChannelData(1), [0, 0]);
});


test('noise', function () {
	var buf1 = new AudioBuffer(4);
	util.noise(buf1);

	assert.notDeepEqual(buf1.getChannelData(0), [0, 0]);
	assert.notDeepEqual(buf1.getChannelData(1), [0, 0]);
});


test('fill', function () {
	var a = AudioBuffer([1,2,3,4]);
	util.fill(a, 1);

	assert.deepEqual(a.getChannelData(0), [1,1]);
	assert.deepEqual(a.getChannelData(1), [1,1]);

	util.fill(a, function (sample, channel, offset) { return channel + offset });

	assert.deepEqual(a.getChannelData(0), [0,1]);
	assert.deepEqual(a.getChannelData(1), [1,2]);
});


test('slice', function () {
	var a = new AudioBuffer(3, [1,2,3,4,5,6,7,8,9]);

	var b = util.slice(a, 1);
	assert.deepEqual(b.getChannelData(0), [2,3]);
	assert.deepEqual(b.getChannelData(1), [5,6]);

	var c = util.slice(a, 1, 2);
	assert.deepEqual(c.getChannelData(0), [2]);
	assert.deepEqual(c.getChannelData(1), [5]);
	assert.deepEqual(c.numberOfChannels, 3);
});


test('map', function () {
	var a = AudioBuffer(3, [1, 1, 1, 1, 1, 1]);

	var b = util.map(a, function (sample, channel, offset) {
		return sample + channel + offset
	});

	assert.notEqual(a, b);
	assert(!util.equal(a, b));
	assert.deepEqual(b.getChannelData(0), [1,2]);
	assert.deepEqual(b.getChannelData(1), [2,3]);
	assert.deepEqual(b.numberOfChannels, 3);
});


test('concat', function () {
	var a = AudioBuffer([1,1,1,1]);
	var b = AudioBuffer(3, 2);
	var c = AudioBuffer(1, [-1, -1], 22050); //handle this!

	var d = util.concat(a, c);
	assert.deepEqual(d.getChannelData(0), [1,1,-1,-1]);
	assert.deepEqual(d.getChannelData(1), [1,1,0,0]);

	var d = util.concat(c, a);
	assert.deepEqual(d.getChannelData(0), [-1,-1,1,1]);
	assert.deepEqual(d.getChannelData(1), [0,0,1,1]);

	var d = util.concat(a, b, c);

	assert.deepEqual(d.getChannelData(0), [1,1,0,0,-1,-1]);
	assert.deepEqual(d.getChannelData(1), [1,1,0,0,0,0]);
	assert.deepEqual(d.getChannelData(2), [0,0,0,0,0,0]);
});


test('resize', function () {
	var a = AudioBuffer(1, [1,1,1,1,1], 44100);

	//set too big
	a = util.resize(a, 10);
	assert.deepEqual(a.getChannelData(0), [1,1,1,1,1,0,0,0,0,0]);

	//set too small
	a = util.resize(a, 2);
	assert.deepEqual(a.getChannelData(0), [1,1]);
});


test('rotate (+ve)', function () {
	var a = AudioBuffer(1, [0,0,1,1,0,0,-1,-1]);
	util.rotate(a, 2);
	assert.deepEqual(a.getChannelData(0), [-1,-1,0,0,1,1,0,0]);
});

test('rotate (-ve)', function() {
	var a = AudioBuffer(1, [0,0,1,1,0,0,-1,-1]);
	util.rotate(a, -3);
	assert.deepEqual(a.getChannelData(0), [1,0,0,-1,-1,0,0,1])
});

test('shift (+ve)', function () {
	var a = AudioBuffer(1, [0,0,1,1,0,0,-1,-1]);
	util.shift(a, 2);
	assert.deepEqual(a.getChannelData(0), [0,0,0,0,1,1,0,0]);
});

test('shift (-ve)', function () {
	var a = AudioBuffer(1, [0,0,1,1,0,0,-1,-1]);
	util.shift(a, -3);
	assert.deepEqual(a.getChannelData(0), [1,0,0,-1,-1,0,0,0])
});
