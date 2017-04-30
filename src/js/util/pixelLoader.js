/**
 * Utility for obtaining pixel offsets for images and text
 * These are loaded either 'on-demand' (via the load function), or
 * by a lazy load since image rendering on the separate canvas is a bit slow
 * TODO: Chunk the lazy load operation, or use webworkers
 */	

var _ = require('underscore');

var registered = [];

function register(loadFunc) {
	var pixels;
	var bounds;
	var loader = {
		load : function() {
			pixels = loadFunc();
			if (!pixels) {
				throw new Error("No pixels loaded!");
			}
			bounds = getBounds(pixels);
		},
		isLoaded : function() {
			return pixels != null;
		},
		getPixels : function() {
			if (!this.isLoaded())
				this.load();
			return pixels;
		},
		getBounds : function() {
			if (!this.isLoaded())
				this.load();
			return bounds;
		}
	}
	registered.push(loader);
	return loader;
}

/**
 * @param text Text of interest
 * @param fontSize Font size in pixels.  Change this to get more resolution on the text
 * @param scaler Scaler object to scale the image
 * @return A 2-d array of the (x, y) pixel offsets that generate the given text
 */
function textToPixelOffsets(text, fontSize, scaler) {
	// Setup the temp canvas
	var tempCanvas = document.createElement("canvas");
	var width = 30 * text.length;
	var height = 30 * text.length;
	tempCanvas.width = width;
	tempCanvas.height = height;

	// Write the text
	var context = tempCanvas.getContext('2d');
	context.fillStyle    = '#FFFFFF';
	context.font         = fontSize + 'px solid Palatino';
	context.fillText(text, 0, 100);

	// Get the pixel offsets and clear the temp canvas
	return getOffsetsAndClearCanvas(
		width,
		height,
		context,
		scaler,
		function(r, g, b, a) {
			return r || g || b || a;
		}
	);
}

/** @return A 2-d array of the (x, y) pixel offsets that generate the given image */
function imageToPixelOffsets(image, scaler, filter) {
	// Setup the temp canvas
	var tempCanvas = document.createElement("canvas");
	tempCanvas.width = image.width;
	tempCanvas.height = image.height;

	// Draw the image
	var context = tempCanvas.getContext('2d');
	context.drawImage(image, 0, 0);

	// Get the pixel offsets and clear the temp canvas
	return getOffsetsAndClearCanvas(
		image.width,
		image.height,
		context,
		scaler,
		filter
	);
}

/** @return Function which scales offset values by stretching and centers them around the origin */
function stretchScaler(xScale, yScale) {
	return function(offsets, bounds) {
		var width = bounds.maxX - bounds.minX;
		var height = bounds.maxY - bounds.minY;

		for (var i = 0; i < offsets.length; i++) {
			var x = offsets[i][0];
			x = (x - bounds.minX - (width / 2)) * (xScale) / (width);
			offsets[i][0] = x;

			var y = offsets[i][1];
			y = (y - bounds.minY - (height / 2)) * (yScale) / (height);
			offsets[i][1] = y;
		}

		return offsets;
	};
}

/**
 * @param filter Function which returns whether the given rgba value should be represented by a Mover
 */
function getOffsetsAndClearCanvas(width, height, context, scaler, filter) {
	// Retrieve the pixels
	var imgData = context.getImageData(0, 0, width, height).data;

	// Clear the canvas
	context.clearRect(0, 0, width, height);

	// Filter and transform into pixel offset 2d array
	// Note that for the scrolling to be simpler, we store from top left to bottom left, then towards the right
	var offsets = [];
	for (var x = 0; x < width; x += 1) {
		for (var y = 0; y < height; y += 1) {
			var i = 4 * (y * width + x);
			if (filter(imgData[i], imgData[i + 1], imgData[i + 2], imgData[i + 3])) {
				offsets.push([x, y]);
			}
		}
	}

	if (offsets.length == 0) {
		return offsets;
	}

	// Scale the image given the bounds
	return scaler.call(null, offsets, getBounds(offsets));
}

/** @param pixels List of lists of size 2 */
function getBounds(pixels) {
	var getX = function(value) {
		return value[0];
	};

	var getY = function(value) {
		return value[1];
	};

	return {
		minX : getX(_.min(pixels, getX)),
		maxX : getX(_.max(pixels, getX)),
		minY : getY(_.min(pixels, getY)),
		maxY : getY(_.max(pixels, getY)),
		width : this.maxX - this.minX,
		height : this.maxY - this.minY
	};
}

var pixelLoader = {
	loadLazy : function() {
		// At sometime in the future ... load all the pixels
		setTimeout(function() {
			var i;
			var loader;
			for (i = 0; i < registered.length; i++) {
				loader = registered[i];
				if (loader.isLoaded())
					continue;
				loader.load();
				pixelLoader.loadLazy();
				return;
			}
		}, 0);
	},
	registerText : function(text, font, stretchX, stretchY) {
		return register(function() {
			return textToPixelOffsets(
				text,
				font,
				stretchScaler(stretchX, stretchY)
			);
		});
	},
	registerImage : function(image, stretchX, stretchY) {
		return register(function() {
			return imageToPixelOffsets(
				image,
				stretchScaler(300, 300),
				function(r, g, b, a) {
					return (r < 200 && g < 200 && b < 200);
				}
			);
		});
	}
};

module.exports = pixelLoader;
