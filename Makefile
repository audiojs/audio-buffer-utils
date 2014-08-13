all: build/audio-buffer-utils.js build/audio-buffer-utils.min.js

build:
	mkdir -p build

clean:
	rm -rf build

build/audio-buffer-utils.js: index.js build
	browserify -o $@ -s audioBufferUtils index.js

build/audio-buffer-utils.min.js: build/audio-buffer-utils.js
	./node_modules/.bin/uglifyjs $< > $@
