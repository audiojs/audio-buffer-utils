it('Fill', function () {
	var a = AudioBuffer([1,2,3,4]);
	a.fill(1);

	assert.deepEqual(a.toArray(), [1,1,1,1]);

	a.fill(function (channel, offset) { return channel + offset });

	assert.deepEqual(a.toArray(), [0,1,1,2]);
});

it('toArray', function () {
	var a = AudioBuffer(4, {interleaved: true});

	a.set(0,0,10);
	a.set(1,0,20);
	a.set(0,1,30);
	a.set(1,1,40);

	assert.deepEqual(a.getChannelData(0), [10, 30]);
	assert.deepEqual(a.getChannelData(1), [20, 40]);
	assert.deepEqual(a.toArray(), [10, 20, 30, 40]);

	//TODO: ponder on this
	// a.interleaved = false;
	// assert.deepEqual(a.toArray(), [10, 20, 30, 40]);
});