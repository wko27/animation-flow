/**
 * Responsible for generating colors for the pixels
 */

const numColors = 36;
const colors = [];

// TODO: Clean this up so we obtain the colors from the image and use them instead ...
const blueColors = ["013459", "0d2a75", "333333", "666666"];
const greenColors = ["00C957", "008B00", "333333", "666666"];

function setColors(baseColors) {
	const newColors = createColorDistribution(baseColors, 0, 1);
	
	// Clear the colors array
	colors.length = 0;
	// Push all new colors into colors array
	Array.prototype.push.apply(colors, newColors);
}

function createColorDistribution(baseColors, minLum, maxLum) {
	var quantityPerColor = numColors / baseColors.length;
	var lumDelta = (maxLum - minLum) / Math.floor(quantityPerColor);
	var lums = [];
	var colors = [];

	for(var i = minLum; i <= maxLum; i += lumDelta) {
		lums.push(Math.round(i * 100) / 100);
	}

	for(var j = 0; j < baseColors.length; j++) {
		for(var k = 0; k < lums.length; k++) {
			colors.push(generateLumVariation(baseColors[j], lums[k]));
		}
	}
	
	if (colors.length != numColors) {
		throw Error("Expected to created " + numColors + " colors, but made " + colors.length);
	}

	return colors;
}

function generateLumVariation(hex, lum) {
	lum = lum || 0;
	var rgb = [];
	var c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i * 2, 2), 16);
		rgb.push(Math.round(Math.min(Math.max(0, c + (c * lum)), 255)));
	}
	return rgb;
}

module.exports = {
	blueColors: blueColors,
	greenColors: greenColors,
	createColorDistribution: createColorDistribution,
	colors: colors,
	numColors: numColors,
	setColors: setColors
}