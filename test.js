var test = it;
var util = require('./');
var assert = require('assert');
var AudioBuffer = require('audio-buffer');
var isBrowser = require('is-browser');

test('create', function () {
	var buf1 = util.create();
	assert.equal(buf1.length, 1);
	assert.equal(buf1.numberOfChannels, 2);

	var buf2 = util.create([[0,1], [0,1], [1,0]]);
	assert.deepEqual(buf2.getChannelData(2), [1, 0]);

	var buf3 = util.create([new Float32Array([0,1]), new Float32Array([0,1]), new Float32Array([1,0])]);
	assert.deepEqual(buf3.getChannelData(2), [1, 0]);

	var buf4 = util.create(2, 5, 44100);
	assert.deepEqual(buf4.getChannelData(0), [0,0,0,0,0]);

	var buf5 = util.create(buf4);
	assert.notEqual(buf4, buf5);
	assert.notEqual(buf4.getChannelData(0), buf5.getChannelData(0));
	assert.deepEqual(buf5.getChannelData(0), [0,0,0,0,0]);

	var buf6 = util.create([1,0,0,1]);
	assert.deepEqual(buf6.getChannelData(1), [0,1]);

	var buf7 = util.create(1, [1,0,0,1]);
	assert.deepEqual(buf7.getChannelData(0), [1,0,0,1]);
});

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

	assert.throws(function () {
		util.equal(buf1, new Float32Array(1));
	});
});

test('shallow', function () {
	var buf1 = new AudioBuffer([0, 1, 2, 3]);
	var buf2 = util.shallow(buf1);

	assert.equal(buf1.length, buf2.length);
	assert.equal(buf1.numberOfChannels, buf2.numberOfChannels);
	assert.equal(buf1.sampleRate, buf2.sampleRate);

	assert.throws(function () {
		util.shallow(new Float32Array(1));
	});
});


test('clone', function () {
	var buf1 = new AudioBuffer([1, 0, -1, 0]);
	var buf2 = util.clone(buf1);

	assert(util.equal(buf1, buf2));
	assert.notEqual(buf1, buf2);

	buf2.getChannelData(0)[1] = 0.5;
	assert.deepEqual(buf1.getChannelData(0), [1, 0]);
	assert.deepEqual(buf2.getChannelData(0), [1, 0.5]);

	assert.throws(function () {
		util.clone({});
	});
});


test('copy', function () {
	var buf1 = new AudioBuffer([1, 0, -1, 0]);
	var buf2 = util.shallow(buf1);

	util.copy(buf1, buf2);

	assert(util.equal(buf1, buf2));
	assert.notEqual(buf1, buf2);

	buf2.getChannelData(0)[1] = 0.5;
	assert.deepEqual(buf1.getChannelData(0), [1, 0]);
	assert.deepEqual(buf2.getChannelData(0), [1, 0.5]);
});


test('clone - backing arrays are not shared between buffers', function () {
	var buf1 = new AudioBuffer([0, 1, 2, 3, 4]);
	var buf2 = util.clone(buf1);

	buf2.getChannelData(0)[0] = 100;
	assert.equal(0, buf1.getChannelData(0)[0]);
});


test('reverse', function () {
	var buf1 = new AudioBuffer([1, 0, -1, 0]);
	util.reverse(buf1);

	assert.deepEqual(buf1.getChannelData(0), [0, 1]);
	assert.deepEqual(buf1.getChannelData(1), [0, -1]);

	assert.throws(function () {
		util.reverse([1,2,3]);
	});

	var buf2 = util.shallow(buf1);
	util.reverse(buf1, buf2);

	assert.deepEqual(buf2.getChannelData(1), [-1, 0]);
});


test('invert', function () {
	var buf1 = new AudioBuffer([1, 0.5, -1, 0]);
	util.invert(buf1);

	assert.deepEqual(buf1.getChannelData(0), [-1, -0.5]);
	assert.deepEqual(buf1.getChannelData(1), [1, 0]);

	assert.throws(function () {
		util.invert(new Float32Array([1,2,3]));
	});

	var buf2 = util.shallow(buf1);
	util.invert(buf1, buf2);

	assert.deepEqual(buf2.getChannelData(1), [-1, 0]);
});


test('zero', function () {
	var buf1 = new AudioBuffer([1, 0.5, -1, 0]);
	util.zero(buf1);

	assert.deepEqual(buf1.getChannelData(0), [0, 0]);
	assert.deepEqual(buf1.getChannelData(1), [0, 0]);

	assert.throws(function () {
		util.invert(buf1.getChannelData(0));
	});
});


test('noise', function () {
	var buf1 = new AudioBuffer(4);
	util.noise(buf1);

	assert.notDeepEqual(buf1.getChannelData(0), [0, 0]);
	assert.notDeepEqual(buf1.getChannelData(1), [0, 0]);

	assert.throws(function () {
		util.noise(buf1.getChannelData(0));
	});
});


test('fill with function', function () {
	var a = new AudioBuffer([1,2,3,4]);
	util.fill(a, function (sample, channel, offset) { return channel + offset });

	assert.deepEqual(a.getChannelData(0), [0,1]);
	assert.deepEqual(a.getChannelData(1), [1,2]);

	assert.throws(function () {
		util.fill([1,2,3], function () {});
	});
});


test('fill with value', function () {
	var a = new AudioBuffer([1,2,3,4]);
	util.fill(a, 1, 1, 3);

	assert.deepEqual(a.getChannelData(0), [1,1]);
	assert.deepEqual(a.getChannelData(1), [3,1]);

	assert.throws(function () {
		util.fill(a.getChannelData(1), 1);
	});
});

test('fill to another buffer', function () {
	var a = new AudioBuffer([1,2,3,4]);
	var b = util.shallow(a);
	util.fill(a, b, 1, 1, 3);

	assert.deepEqual(a.getChannelData(0), [1,2]);
	assert.deepEqual(a.getChannelData(1), [3,4]);

	assert.deepEqual(b.getChannelData(0), [0,1]);
	assert.deepEqual(b.getChannelData(1), [0,1]);
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

	b.getChannelData(0)[0] = 1;
	assert.deepEqual(b.getChannelData(0), [1,3]);
	assert.deepEqual(a.getChannelData(0), [1, 2, 3]);

	assert.throws(function () {
		util.slice([1,2,3,4], 1, 2);
	});
});


test.skip('subbuffer', function () {
	//NOTE: in web-audio-API two audiobuffers cannot share the same memory
	//as far `.buffer` property of typedarrays cannot be overridden
	//and typedarrays are created by WebAudioBuffer innerly

	var a = new AudioBuffer(3, [1,2,3,4,5,6,7,8,9]);

	var b = util.subbuffer(a, 1);
	assert.deepEqual(b.getChannelData(0), [2,3]);
	assert.deepEqual(b.getChannelData(1), [5,6]);

	var c = util.subbuffer(a, 1, 2);
	assert.deepEqual(c.getChannelData(0), [2]);
	assert.deepEqual(c.getChannelData(1), [5]);
	assert.deepEqual(c.numberOfChannels, 3);

	b.getChannelData(0)[0] = 1;
	assert.deepEqual(b.getChannelData(0), [1,3]);
	assert.deepEqual(a.getChannelData(0), [1, 1, 3]);
	assert.deepEqual(c.getChannelData(0), [1]);
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

	b.getChannelData(0)[0] = 0;
	assert.deepEqual(a.getChannelData(0), [1,1]);
	assert.deepEqual(b.getChannelData(0), [0,2]);

	assert.throws(function () {
		util.map([1,2,3,4], function () {});
	});
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

	assert.throws(function () {
		util.concat([1,2,3,4], [5,6]);
	});
});


test('resize', function () {
	var a = AudioBuffer(1, [1,1,1,1,1], 44100);

	//set too big
	a = util.resize(a, 10);
	assert.deepEqual(a.getChannelData(0), [1,1,1,1,1,0,0,0,0,0]);

	//set too small
	a = util.resize(a, 2);
	assert.deepEqual(a.getChannelData(0), [1,1]);

	assert.throws(function () {
		util.resize('123', 2);
	});
});


test('rotate (+ve)', function () {
	var a = AudioBuffer(1, [0,0,1,1,0,0,-1,-1]);
	util.rotate(a, 2);
	assert.deepEqual(a.getChannelData(0), [-1,-1,0,0,1,1,0,0]);

	assert.throws(function () {
		util.rotate([1,2,3], 2);
	});
});

test('rotate (-ve)', function() {
	var a = AudioBuffer(1, [0,0,1,1,0,0,-1,-1]);
	util.rotate(a, -3);
	assert.deepEqual(a.getChannelData(0), [1,0,0,-1,-1,0,0,1]);

	assert.throws(function () {
		util.rotate([1,2,3], -2);
	});
});


test('shift (+ve)', function () {
	var a = AudioBuffer(1, [0,0,1,1,0,0,-1,-1]);
	util.shift(a, 2);
	assert.deepEqual(a.getChannelData(0), [0,0,0,0,1,1,0,0]);

	assert.throws(function () {
		util.shift([1,2,3], 2);
	});
});

test('shift (-ve)', function () {
	var a = AudioBuffer(1, [0,0,1,1,0,0,-1,-1]);
	util.shift(a, -3);
	assert.deepEqual(a.getChannelData(0), [1,0,0,-1,-1,0,0,0]);

	assert.throws(function () {
		util.shift([1,2,3], -2);
	});
});


test('normalize', function () {
	var a = AudioBuffer(1, [0, 0.1, 0, -0.2]);

	util.normalize(a);

	assert.deepEqual(a.getChannelData(0), [0, 0.5, 0, -1]);

	//too big value
	//FIXME: too large values are interpreted as 1, but maybe we need deamplifying instead
	//for example, biquad-filters may return values > 1, then we do not want to clip values
	var a = AudioBuffer(2, [0, 0.1, 0, -0.5, 999, 2]);

	util.normalize(a);

	assert.deepEqual(a.getChannelData(1), [-0.5, 1, 1]);

	assert.throws(function () {
		util.normalize(new Float32Array([0, 0.1, 0.2]));
	});
});


test('trim', function () {
	//trim both
	var a = AudioBuffer([0,0,1,0,0,2,3,0]);
	var b = util.trim(a);

	assert.deepEqual(b.getChannelData(0), [0,1]);
	assert.deepEqual(b.getChannelData(1), [2,3]);

	//no trim
	var a = AudioBuffer([1,0,1,0,0,2,3,1]);
	var b = util.trim(a);

	assert.deepEqual(b.getChannelData(0), [1,0,1,0]);
	assert.deepEqual(b.getChannelData(1), [0,2,3,1]);

	assert.throws(function () {
		util.normalize(new Float32Array([0, 0.1, 0.2]));
	});
});


test('size', function () {
	var a = AudioBuffer(200);
	assert.equal(util.size(a), 200 * 2 * 4);

	if (!isBrowser && typeof Float64Array !== 'undefined') {
		AudioBuffer.FloatArray = Float64Array;
		var b = AudioBuffer(3, 200, 5000);
		assert.equal(util.size(b), 3 * 200 * 8 );
		AudioBuffer.FloatArray = Float32Array;
	}

	assert.throws(function () {
		util.size();
	});
});


test.skip('resample', function () {
	//NOTE: for resampling use https://github.com/scijs/ndarray-resample
	//or similar.

	var a = AudioBuffer(1, [0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5, 0], 44100);
	var b = util.resample(a, 3000);

	assert.deepEqual(b.getChannelData(0), []);
});


test('mix', function () {
	var a = AudioBuffer(2, [0,1,0,1]);
	var b = AudioBuffer(2, [0.5, 0.5, -0.5, -0.5]);

	//simple mix
	util.mix(a, b);
	assert.deepEqual(a.getChannelData(0), [0.25, 0.75]);
	assert.deepEqual(a.getChannelData(1), [-0.25, 0.25]);

	//fn mix
	var a = AudioBuffer(2, [0, 1, 0, 1, 0, 1]);
	var b = AudioBuffer(2, [1, 1, 1, 1]);
	util.mix(a, b, function (v1, v2) {
		return v1 + v2;
	}, 1);

	assert.deepEqual(a.getChannelData(0), [0, 2, 1]);
	assert.deepEqual(a.getChannelData(1), [1, 1, 2]);

	assert.throws(function () {
		util.mix([1,2,3], [4,5,6], 0.1);
	});
});


test('data', function () {
	var b = util.create(3, [1,-1, 0.5, -1, 0, -0.5]);

	var data = util.data(b);

	assert.deepEqual(data[0], [1, -1]);
	assert.deepEqual(data[1], [0.5, -1]);
	assert.deepEqual(data[2], [0, -0.5]);

	var src = [new Float32Array(2), new Float32Array(2), new Float32Array(2)];
	var data = util.data(b, src);

	assert.deepEqual(src[0], [1, -1]);
	assert.deepEqual(src[1], [0.5, -1]);
	assert.deepEqual(src[2], [0, -0.5]);
});