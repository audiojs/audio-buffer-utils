var test = it;
var util = require('./');
var assert = require('assert');
var AudioBuffer = require('audio-buffer');


test('equal', function () {
	var buf1 = new AudioBuffer([1, 0, -1, 0]);
	var buf2 = new AudioBuffer([1, 0, -1, 0]);
	var buf3 = new AudioBuffer([1, 0, 1, 0]);
	var buf4 = new AudioBuffer([1, 0, 1, 0, 1]); //the last sample is lost

	assert(util.equal(buf1, buf2));
	assert(!util.equal(buf1, buf3));
	assert(!util.equal(buf1, buf4));
	assert(util.equal(buf3, buf4));
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
	a.fill(1);

	assert.deepEqual(a.toArray(), [1,1,1,1]);

	a.fill(function (channel, offset) { return channel + offset });

	assert.deepEqual(a.toArray(), [0,1,1,2]);
});