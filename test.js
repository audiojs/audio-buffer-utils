var util = require('./');
var AudioBuffer = require('audio-buffer');
var isBrowser = require('is-browser');
var test = require('tape')
var almost = require('almost-equal')
var NDArray = require('ndarray')


function almostEqual (x, y) {
	if (x.length && y.length) return x.every(function (x, i) {
		return almostEqual(x, y[i]);
	});

	var EPSILON = 1e-5;
	if (!almost(x, y, EPSILON)) t.fail(x, y,
		`${x} ≈ ${y}`, '≈');

	return true;
};

test('zero constructor', function (t) {
	var buffer = util.create()

	t.equal(buffer.length, 1)
	t.equal(buffer.numberOfChannels, 1)

	t.end()
});

test('from Array', function (t) {
	var buffer = util.create([
		0, 1, 0, 1, 0, 1
	], 2);

	t.deepEqual(buffer.getChannelData(0), [0, 1, 0]);
	t.deepEqual(buffer.getChannelData(1), [1, 0, 1]);
	t.end()
});

test('from Number', function (t) {
	var buffer = util.create(2, 2)

	t.equal(buffer.length, 2)

	t.end()
})

test('from Float32Array', function (t) {
	var buffer = util.create(new Float32Array([
		0, 1, 0, 1, 0, 1, 0, 1, 0
	]), 3);

	t.deepEqual(buffer.getChannelData(0), [0, 1, 0]);
	t.deepEqual(buffer.getChannelData(1), [1, 0, 1]);
	t.deepEqual(buffer.getChannelData(2), [0, 1, 0]);
	t.end()
});

test('from Buffer', function (t) {
	var data = new Buffer(8*3);
	data.writeFloatLE(1.0, 0);
	data.writeFloatLE(-1.0, 4);
	data.writeFloatLE(0.5, 8);
	data.writeFloatLE(-0.5, 12);
	data.writeFloatLE(-1, 16);
	data.writeFloatLE(0.5, 20);

	var buffer = util.create(data, 'float32 3-channel')

	t.deepEqual(buffer.getChannelData(0), [1, -1.0]);
	t.deepEqual(buffer.getChannelData(1), [0.5, -0.5]);
	t.deepEqual(buffer.getChannelData(2), [-1, 0.5]);
	t.end()
});

test('from AudioBuffer', function (t) {
	var a1 = util.create([1,-1,0.5,-0.5], 2);
	var a2 = util.create(a1);
	var a3 = util.create(a1);

	t.notEqual(a1, a2);
	t.notEqual(a1, a3);
	t.deepEqual(a3.getChannelData(1), [0.5,-0.5]);

	a1.getChannelData(0)[0] = 0;
	t.deepEqual(a1.getChannelData(0), [0,-1]);
	t.deepEqual(a2.getChannelData(0), [1,-1]);
	t.end()
});

test('from ArrayBuffer', function (t) {
	var a = util.create( (new Float32Array([1,-1,0.5,-0.5])).buffer, 'float32 stereo');
	t.deepEqual(a.getChannelData(1), [0.5,-0.5]);
	t.deepEqual(a.getChannelData(0), [1,-1]);
	t.end()
});

test('from NDArray', function (t) {
	var a = util.create( new NDArray(new Float32Array([1,-1,0.5,-0.5]), [2,2]));
	t.deepEqual(a.getChannelData(1), [0.5,-0.5]);
	t.deepEqual(a.getChannelData(0), [1,-1]);

	//FIXME: there might need more tests, like detection of ndarray dimensions etc
	t.end()
});

test('from Array of Arrays', function (t) {
	var a = util.create([ [1, -1], [0.5,-0.5], [-1, 0.5] ]);
	t.deepEqual(a.getChannelData(1), [0.5,-0.5]);
	t.deepEqual(a.getChannelData(0), [1,-1]);

	var a = util.create([ [1, -1], [0.5,-0.5], [-1, 0.5] ] );
	t.deepEqual(a.getChannelData(1), [0.5,-0.5]);
	t.deepEqual(a.getChannelData(0), [1,-1]);
	t.deepEqual(a.getChannelData(2), [-1,0.5]);

	t.notEqual(Array.isArray(a.getChannelData(0)))

	t.end()
});

if (isBrowser) test('from WAABuffer', function (t) {
	var buf = util.context.createBuffer(3, 2, 44100);
	buf.getChannelData(0).fill(1);
	buf.getChannelData(1).fill(-1);
	buf.getChannelData(2).fill(0);

	var a = util.create( buf, 3 );
	t.deepEqual(a.getChannelData(2), [0,0]);
	t.deepEqual(a.getChannelData(1), [-1,-1]);
	t.deepEqual(a.getChannelData(0), [1,1]);

	t.throws(function () {
		util.create(0, 2)
	})
	//test that data is bound
	//NOTE: it seems that is shouldn’t - we can gracefully clone the buffer
	// buf.getChannelData(2).fill(0.5);
	// t.deepEqual(a.getChannelData(2), buf.getChannelData(2));

	t.end()
});

test('length', function (t) {
	var buffer = util.create(Array(12), 1);
	t.equal(buffer.length, 12);
	var buffer = util.create(Array(12), 2);
	t.equal(buffer.length, 6);
	var buffer = util.create(Array(12), 3);
	t.equal(buffer.length, 4);
	var buffer = util.create(Array(12), 4);
	t.equal(buffer.length, 3);
	var buffer = util.create(Array(12), 6);
	t.equal(buffer.length, 2);

	t.end()
});


test('clone', function (t) {
	var a = util.create(10, 3, 3000);
	var b = util.create(a);
	var c = util.create(a, 2, 4000);

	t.notEqual(a, b);
	t.deepEqual(a.getChannelData(0), b.getChannelData(0));
	t.deepEqual(a.getChannelData(2), b.getChannelData(2));
	t.equal(b.numberOfChannels, 3);
	t.equal(b.sampleRate, 3000);
	t.equal(c.sampleRate, 4000);
	t.equal(c.numberOfChannels, 2);
	t.deepEqual(a.getChannelData(0), c.getChannelData(0));
	t.deepEqual(a.getChannelData(1), c.getChannelData(1));

	if (isBrowser) {
		var a = util.context.createBuffer(2,10,44100);
		var b = util.create(a);

		t.notEqual(a, b);
		t.notEqual(a.getChannelData(0), b.getChannelData(0));
		t.deepEqual(a.getChannelData(0), b.getChannelData(0));
	}
	t.end()
});



test('create', function (t) {
	var buf1 = util.create();
	t.equal(buf1.length, 1);
	t.equal(buf1.numberOfChannels, 1);

	var buf2 = util.create([[0,1], [0,1], [1,0]]);
	t.deepEqual(buf2.getChannelData(2), [1, 0]);
	t.equal(buf2.numberOfChannels, 3)

	var buf3 = util.create([new Float32Array([0,1]), new Float32Array([0,1]), new Float32Array([1,0])]);
	t.deepEqual(buf3.getChannelData(2), [1, 0]);

	var buf4 = util.create(5, 2, 44100);
	t.deepEqual(buf4.getChannelData(0), [0,0,0,0,0]);
	t.equal(buf4.numberOfChannels, 2)

	var buf5 = util.create(buf4);
	t.notEqual(buf4, buf5);
	t.notEqual(buf4.getChannelData(0), buf5.getChannelData(0));
	t.deepEqual(buf5.getChannelData(0), [0,0,0,0,0]);
	t.equal(buf5.numberOfChannels, 2)

	var buf6 = util.create([1,0,0,1], 2);
	t.deepEqual(buf6.getChannelData(1), [0,1]);
	t.equal(buf5.numberOfChannels, 2)

	var buf7 = util.create([1,0,0,1], 1);
	t.deepEqual(buf7.getChannelData(0), [1,0,0,1]);
	t.equal(buf7.numberOfChannels, 1)
	t.end()
});

test('equal', function (t) {
	var buf1 = util.create([1, 0, -1, 0], 2);
	var buf2 = util.create([1, 0, -1, 0], 2);
	var buf3 = util.create([1, 0, 1, 0], 2);
	var buf4 = util.create([1, 0, 1, 0, 1], 2); //the last sample is lost
	var buf5 = util.create([1, 0, 1, 0], 2);

	t.ok(util.equal(buf1, buf2));
	t.ok(!util.equal(buf1, buf3));
	t.ok(!util.equal(buf1, buf4));
	t.ok(util.equal(buf3, buf4));
	t.ok(util.equal(buf3, buf4, buf5));
	t.ok(!util.equal(buf4, buf5, buf3, buf1));

	t.throws(function () {
		util.equal(buf1, new Float32Array(1));
	});
	t.end()
});

test('shallow', function (t) {
	var buf1 = util.create([0, 1, 2, 3]);
	var buf2 = util.shallow(buf1);

	t.equal(buf1.length, buf2.length);
	t.equal(buf1.numberOfChannels, buf2.numberOfChannels);
	t.equal(buf1.sampleRate, buf2.sampleRate);

	t.throws(function () {
		util.shallow(new Float32Array(1));
	});
	t.end()
});


test('clone', function (t) {
	var buf1 = util.create([1, 0, -1, 0], 2);
	var buf2 = util.clone(buf1);

	t.ok(util.equal(buf1, buf2));
	t.notEqual(buf1, buf2);

	buf2.getChannelData(0)[1] = 0.5;
	t.deepEqual(buf1.getChannelData(0), [1, 0]);
	t.deepEqual(buf2.getChannelData(0), [1, 0.5]);

	t.throws(function () {
		util.clone({});
	});
	t.end()
});


test('copy', function (t) {
	var buf1 = util.create([1, 0, -1, 0], 2);
	var buf2 = util.shallow(buf1);

	util.copy(buf1, buf2);

	t.ok(util.equal(buf1, buf2));
	t.notEqual(buf1, buf2);

	buf2.getChannelData(0)[1] = 0.5;
	t.deepEqual(buf1.getChannelData(0), [1, 0]);
	t.deepEqual(buf2.getChannelData(0), [1, 0.5]);

	var buf3 = util.create(8);
	util.copy(buf2, buf3, 4);
	t.deepEqual(buf3.getChannelData(0), [0,0,0,0, 1, 0.5, 0, 0]);

	// util.copy(buf3, buf2);
	t.end()
});


test('clone - backing arrays are not shared between buffers', function (t) {
	var buf1 = util.create([0, 1, 2, 3, 4]);
	var buf2 = util.clone(buf1);

	buf2.getChannelData(0)[0] = 100;
	t.equal(0, buf1.getChannelData(0)[0]);
	t.end()
});


test('reverse', function (t) {
	var buf1 = util.create([1, 0, -1, 0], 2);
	util.reverse(buf1);

	t.deepEqual(buf1.getChannelData(0), [0, 1]);
	t.deepEqual(buf1.getChannelData(1), [0, -1]);

	t.throws(function () {
		util.reverse([1,2,3]);
	});

	var buf2 = util.shallow(buf1);
	util.reverse(buf1, buf2);

	t.deepEqual(buf2.getChannelData(1), [-1, 0]);

	var buf3 = util.create([0,.1,.2,.3,.4,.5])
	util.reverse(buf3, 1,3)
	t.deepEqual(buf3.getChannelData(0), new Float32Array([0,.2,.1,.3,.4,.5]))

	t.end()
});


test('invert', function (t) {
	var buf1 = util.create([1, 0.5, -1, 0], 2);
	util.invert(buf1);

	t.deepEqual(buf1.getChannelData(0), [-1, -0.5]);
	t.deepEqual(buf1.getChannelData(1), [1, 0]);

	t.throws(function () {
		util.invert(new Float32Array([1,2,3]));
	});

	var buf2 = util.shallow(buf1);
	util.invert(buf1, buf2);

	t.deepEqual(buf2.getChannelData(1), [-1, 0]);


	var buf3 = util.create([0,.1,.2,.3,.4,.5], 1)
	util.invert(buf3, 1,3)
	t.deepEqual(buf3.getChannelData(0), new Float32Array([0,-.1,-.2,.3,.4,.5]))

	t.end()
});


test('zero', function (t) {
	var buf1 = util.create([1, 0.5, -1, 0], 2);
	util.zero(buf1);

	t.deepEqual(buf1.getChannelData(0), [0, 0]);
	t.deepEqual(buf1.getChannelData(1), [0, 0]);

	t.throws(function () {
		util.invert(buf1.getChannelData(0));
	});
	t.end()
});


test('noise', function (t) {
	var buf1 = util.create(4, 2);
	util.noise(buf1);

	t.notDeepEqual(buf1.getChannelData(0), [0, 0]);
	t.notDeepEqual(buf1.getChannelData(1), [0, 0]);

	t.throws(function () {
		util.noise(buf1.getChannelData(0));
	});
	t.end()
});


test('fill with function', function (t) {
	var a = util.create([1,2,3,4], 2);
	util.fill(a, function (sample, channel, offset) { return channel + offset });

	t.deepEqual(a.getChannelData(0), [0,1]);
	t.deepEqual(a.getChannelData(1), [1,2]);

	t.throws(function () {
		util.fill([1,2,3], function () {});
	});
	t.end()
});


test('fill with value', function (t) {
	var a = util.create([1,2,3,4], 2);
	util.fill(a, 1, 1, 3);

	t.deepEqual(a.getChannelData(0), [1,1]);
	t.deepEqual(a.getChannelData(1), [3,1]);

	t.throws(function () {
		util.fill(a.getChannelData(1), 1);
	});
	t.end()
});

test('fill to another buffer', function (t) {
	var a = util.create([1,2,3,4], 2);
	var b = util.shallow(a);
	util.fill(a, b, 1, 1, 3);

	t.deepEqual(a.getChannelData(0), [1,2]);
	t.deepEqual(a.getChannelData(1), [3,4]);

	t.deepEqual(b.getChannelData(0), [0,1]);
	t.deepEqual(b.getChannelData(1), [0,1]);
	t.end()
});

test('fill callback argument', function (t) {
	var a = util.create([1,2,3,4], 2);

	//NOTE: such arguments are possible in case of `Through(util.noise)` etc.
	util.fill(a, function () {}, function () { return 1; });

	t.deepEqual(a.getChannelData(0), [1,1]);
	t.deepEqual(a.getChannelData(1), [1,1]);
	t.end()
});

test('fill negative offsets', function (t) {
	var a = util.create(10)

	util.fill(a, .1, -2)
	t.deepEqual(a.getChannelData(0), new Float32Array([0,0,0,0,0,0,0,0,.1,.1]))

	util.fill(a, .2, 0, -7)
	t.deepEqual(a.getChannelData(0), new Float32Array([.2,.2,.2,0,0,0,0,0,.1,.1]))

	t.end()
})

test('slice', function (t) {
	var a = util.create([1,2,3,4,5,6,7,8,9], 3);

	var b = util.slice(a, 1);
	t.deepEqual(b.getChannelData(0), [2,3]);
	t.deepEqual(b.getChannelData(1), [5,6]);

	var c = util.slice(a, 1, 2);
	t.deepEqual(c.getChannelData(0), [2]);
	t.deepEqual(c.getChannelData(1), [5]);
	t.deepEqual(c.numberOfChannels, 3);

	b.getChannelData(0)[0] = 1;
	t.deepEqual(b.getChannelData(0), [1,3]);
	t.deepEqual(a.getChannelData(0), [1, 2, 3]);

	t.throws(function () {
		util.slice([1,2,3,4], 1, 2);
	});
	t.end()
});

test('repeat', function (t) {
	var a = util.create([0,.5,1])

	var a0 = util.repeat(a, 0)
	t.equal(a0.length, 0)

	var a1 = util.repeat(a, 1)
	t.equal(a1.length, 3)
	t.deepEqual(a1, a)

	var a2 = util.repeat(a, 2)
	t.deepEqual(a2.getChannelData(0), [0,.5,1,0,.5,1])

	var a3 = util.repeat(a, 3)
	t.deepEqual(a3.getChannelData(0), [0,.5,1,0,.5,1,0,.5,1])

	t.end()
})

test('subbuffer', function (t) {
	// var a = util.create([0, .1, .2, .3])
	// var b = util.create([a.getChannelData(0).subarray(1,2)])
	// b.getChannelData(0)[0] = .4
	// t.deepEqual(a.getChannelData(0), new Float32Array([0, .4, .2, .3]))

	var a = util.create([1,2,3,4,5,6,7,8,9], 3);

	var b = util.subbuffer(a, 1);
	b.getChannelData(0)[0] += .5
	t.deepEqual(a.getChannelData(0), [1,2.5,3]);
	t.deepEqual(b.getChannelData(0), [2.5,3]);
	t.deepEqual(b.getChannelData(1), [5,6]);

	var c = util.subbuffer(a, 1, 2);
	c.getChannelData(1)[0] += .5
	t.deepEqual(a.getChannelData(0), [1,2.5,3]);
	t.deepEqual(a.getChannelData(1), [4,5.5,6]);
	t.deepEqual(c.getChannelData(0), [2.5]);
	t.deepEqual(c.getChannelData(1), [5.5]);
	t.deepEqual(c.numberOfChannels, 3);

	b.getChannelData(2)[0] = 1;
	t.deepEqual(b.getChannelData(2), [1, 9]);
	t.deepEqual(a.getChannelData(2), [7, 1, 9]);
	t.deepEqual(c.getChannelData(2), [1]);

	if (isBrowser) {
		var s = util.context.createBufferSource()
		t.throws(function () {
			s.buffer = c
		})
		s.buffer = util.slice(c)
	}

	var d = util.subbuffer(a, [1,2])
	t.deepEqual(d.getChannelData(0), [4,5.5,6])
	t.deepEqual(d.getChannelData(1), [7,1,9])
	t.ok(d.duration)

	t.end()
});


test('map', function (t) {
	var a = util.create([1, 1, 1, 1, 1, 1], 3);
	var b = util.shallow(a)

	var b = util.fill(a, b, function (sample, channel, offset) {
		return sample + channel + offset
	});

	t.notEqual(a, b);
	t.ok(!util.equal(a, b));
	t.deepEqual(b.getChannelData(0), [1,2]);
	t.deepEqual(b.getChannelData(1), [2,3]);
	t.deepEqual(b.numberOfChannels, 3);

	b.getChannelData(0)[0] = 0;
	t.deepEqual(a.getChannelData(0), [1,1]);
	t.deepEqual(b.getChannelData(0), [0,2]);

	t.throws(function () {
		util.fill([1,2,3,4], function () {});
	});
	t.end()
});


test('concat', function (t) {
	var a = util.create([1,1,1,1], 2);
	var b = util.create(2, 3);
	var c = util.create([-1, -1], 1, 22050); //handle this!

	var d = util.concat(a, c);
	t.deepEqual(d.getChannelData(0), [1,1,-1,-1]);
	t.deepEqual(d.getChannelData(1), [1,1,0,0]);

	var d = util.concat(c, a);
	t.deepEqual(d.getChannelData(0), [-1,-1,1,1]);
	t.deepEqual(d.getChannelData(1), [0,0,1,1]);

	var d = util.concat(a, b, c);

	t.deepEqual(d.getChannelData(0), [1,1,0,0,-1,-1]);
	t.deepEqual(d.getChannelData(1), [1,1,0,0,0,0]);
	t.deepEqual(d.getChannelData(2), [0,0,0,0,0,0]);

	var d = util.concat([a, b, c]);

	t.deepEqual(d.getChannelData(0), [1,1,0,0,-1,-1]);
	t.deepEqual(d.getChannelData(1), [1,1,0,0,0,0]);
	t.deepEqual(d.getChannelData(2), [0,0,0,0,0,0]);

	t.throws(function () {
		util.concat([1,2,3,4], [5,6]);
	});

	var e = util.concat(util.create(4), util.create(1),util.create(1),util.create(1),util.create(1),util.create(1),util.create(1))
	t.equal(e.length, 10)

	t.end()
});


test('resize', function (t) {
	var a = util.create([1,1,1,1,1], 1, 44100);

	//set too big
	a = util.resize(a, 10);
	t.deepEqual(a.getChannelData(0), [1,1,1,1,1,0,0,0,0,0]);

	//set too small
	a = util.resize(a, 2);
	t.deepEqual(a.getChannelData(0), [1,1]);

	t.throws(function () {
		util.resize('123', 2);
	});
	t.end()
});


test('rotate (+ve)', function (t) {
	var a = util.create([0,0,1,1,0,0,-1,-1]);
	util.rotate(a, 2);
	t.deepEqual(a.getChannelData(0), [-1,-1,0,0,1,1,0,0]);

	t.throws(function () {
		util.rotate([1,2,3], 2);
	});
	t.end()
});

test('rotate (-ve)', function(t) {
	var a = util.create([0,0,1,1,0,0,-1,-1]);
	util.rotate(a, -3);
	t.deepEqual(a.getChannelData(0), [1,0,0,-1,-1,0,0,1]);

	t.throws(function () {
		util.rotate([1,2,3], -2);
	});
	t.end()
});


test('shift (+ve)', function (t) {
	var a = util.create([0,0,1,1,0,0,-1,-1]);
	util.shift(a, 2);
	t.deepEqual(a.getChannelData(0), [0,0,0,0,1,1,0,0]);

	t.throws(function () {
		util.shift([1,2,3], 2);
	});
	t.end()
});

test('shift (-ve)', function (t) {
	var a = util.create([0,0,1,1,0,0,-1,-1]);
	util.shift(a, -3);
	t.deepEqual(a.getChannelData(0), [1,0,0,-1,-1,0,0,0]);

	t.throws(function () {
		util.shift([1,2,3], -2);
	});
	t.end()
});


test('normalize', function (t) {
	var a = util.create([0, 0.2, 0, -0.4]);
	util.normalize(a);
	t.deepEqual(a.getChannelData(0), [0, .5, 0, -1]);

	var b = util.create([0, 1, 0, -1]);
	util.normalize(b);
	t.deepEqual(b.getChannelData(0), [0, 1, 0, -1]);

	var c = util.create([0, 5, 0, -5]);
	util.normalize(c);
	t.deepEqual(c.getChannelData(0), [0, 1, 0, -1]);

	//channels static
	var c = util.create([0, .25, 0, -.5], 2);
	util.normalize(c);
	t.deepEqual(c.getChannelData(0), [0, .5]);
	t.deepEqual(c.getChannelData(1), [0, -1]);

	//too big value
	//FIXME: too large values are interpreted as 1, but maybe we need deamplifying instead
	//for example, biquad-filters may return values > 1, then we do not want to clip values
	var a = util.create([0, 0.1, 0, -0.5, 999, 2], 2);

	util.normalize(a);

	t.deepEqual(a.getChannelData(1), [-0.5, 1, 1]);

	t.throws(function () {
		util.normalize(new Float32Array([0, 0.1, 0.2]));
	});
	t.end()
});

test('removeStatic', function (t) {
	var a = util.create([.5,.7,.3,.5], 2)

	util.removeStatic(a)

	t.ok(almostEqual, a.getChannelData(0), [-.1, .1])
	t.ok(almostEqual, a.getChannelData(1), [-.1, .1])
	t.end()
});


test('trim', function (t) {
	//trim single
	var a = util.create([0,0,1,0,0], 1)
	var b = util.trim(a)
	t.deepEqual(b.getChannelData(0), [1])

	//trim both
	var a = util.create([0,0,1,0,0,2,3,0], 2);
	var b = util.trim(a);

	t.deepEqual(b.getChannelData(0), [0,1]);
	t.deepEqual(b.getChannelData(1), [2,3]);

	//no trim
	var a = util.create([1,0,1,0,0,2,3,1], 2);
	var b = util.trim(a);

	t.deepEqual(b.getChannelData(0), [1,0,1,0]);
	t.deepEqual(b.getChannelData(1), [0,2,3,1]);

	t.throws(function () {
		util.trim(new Float32Array([0, 0.1, 0.2]));
	});
	t.end()
});


test('pad', function (t) {
	//pad right
	var a = util.create([0,1,2,3,4,5], 2);
	var b = util.padRight(a, 4);

	t.deepEqual(b.getChannelData(0), [0,1,2,0]);
	t.deepEqual(b.getChannelData(1), [3,4,5,0]);

	//pad left
	var a = util.create([0,1,2,3,4,5], 2);
	var b = util.padLeft(a, 4);

	t.deepEqual(b.getChannelData(0), [0,0,1,2]);
	t.deepEqual(b.getChannelData(1), [0,3,4,5]);

	//pad value
	var a = util.create([0,1,2,3,4,5], 2);
	var b = util.pad(4, a, 0.5);

	t.deepEqual(b.getChannelData(0), [0.5,0,1,2]);
	t.deepEqual(b.getChannelData(1), [0.5,3,4,5]);

	t.throws(function () {
		util.pad(new Float32Array([0, 0.1, 0.2]));
	});

	//pad conversion
	var a = util.create(1, 1)
	var b = util.pad(a, 10);
	t.equal(b.numberOfChannels, 1);

	t.end()
});


test('size', function (t) {
	var a = util.create(200, 2);
	t.equal(util.size(a), 200 * 2 * 4);

	t.throws(function () {
		util.size();
	});
	t.end()
});


test('mix', function (t) {
	var a = util.create([0,1,0,1], 2);
	var b = util.create([0.5, 0.5, -0.5, -0.5], 2);

	//simple mix
	util.mix(a, b);
	t.deepEqual(a.getChannelData(0), [0.25, 0.75]);
	t.deepEqual(a.getChannelData(1), [-0.25, 0.25]);

	//fn mix
	var a = util.create([0, 1, 0, 1, 0, 1], 2);
	var b = util.create([1, 1, 1, 1], 2);
	util.mix(a, b, function (v1, v2) {
		return v1 + v2;
	}, 1);

	t.deepEqual(a.getChannelData(0), [0, 2, 1]);
	t.deepEqual(a.getChannelData(1), [1, 1, 2]);

	t.throws(function () {
		util.mix([1,2,3], [4,5,6], 0.1);
	});
	t.end()
});


test('data', function (t) {
	var b = util.create([1,-1, 0.5, -1, 0, -0.5], 3);

	var data = util.data(b);

	t.deepEqual(data[0], [1, -1]);
	t.deepEqual(data[1], [0.5, -1]);
	t.deepEqual(data[2], [0, -0.5]);

	var src = [new Float32Array(2), new Float32Array(2), new Float32Array(2)];
	var data = util.data(b, src);

	t.deepEqual(src[0], [1, -1]);
	t.deepEqual(src[1], [0.5, -1]);
	t.deepEqual(src[2], [0, -0.5]);
	t.end()
});
