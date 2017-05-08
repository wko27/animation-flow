/**
 * Each animation composes of a series of states.
 * Each state defines a (possibly moving) target location for each mover.
 * 
 */

const pixelLoader = require('./util/pixelLoader'),
	colors = require('./colors');

/** Useful constants */
var PI_2 = Math.PI * 2;
var PI_BY_2 = Math.PI / 2;

function getCache(f) {
	var cache = {};
	return function(input) {
		if (!(cache.hasOwnProperty(input))) {
			cache[input] = f(input);
		}
		return cache[input];
	};
}

var cosine = getCache(Math.cos);
var sine  = getCache(Math.sin);

function slowDown(animationState) {
	animationState.friction = 0.9;
}

function speedUp(animationState) {
	animationState.friction = 1.0;
}

function explode(animationState) {
	friction = 1;
	var i = animationState.movers.length;
	while (i-- > 0) {
		var m = animationState.movers[i];
		m.vX  = cosine(i) * (Math.random() - 0.5) * 70;
		m.vY  = cosine(i) * (Math.random() - 0.5) * 70;
		m.targetX = Math.random() * animationState.canvasW;
		m.targetY = Math.random() * animationState.canvasH;
	}
}

function normInput(animationState, input) {
	return 31 * input % animationState.movers.length;
}

function norm2Input(animationState, input) {
	return 17 * input % animationState.movers.length;
}

var cornerPositions = (function() {
	var pos = [];
	var i = 4;
	while (i-- > 0) {
		var angle = Math.PI / 2 * i;
		pos.push([Math.round(cosine(angle)), Math.round(sine(angle))]);
	}
	return pos;
})();

function diamond(animationState, centerX, centerY, radius, rotationSpeed, m) {
	var angle = ((normInput(animationState, m.count) + animationState.updateCount * rotationSpeed) % animationState.movers.length) / animationState.movers.length * PI_2;
	var quadrant = Math.floor(angle / PI_BY_2);
	angle = angle - quadrant * PI_BY_2;
	
	var cos = cosine(angle);
	var sin = sine(angle);
	var xOffset = cos * cos;
	var yOffset = sin * sin;
	
	// erm ...
	if (quadrant === 0) {
		xOffset = 1 - xOffset;
		yOffset = 1 - yOffset;
	} else if (quadrant === 1) {
		yOffset = -yOffset;
	} else if (quadrant === 2	) {
		xOffset = xOffset - 1;
		yOffset = yOffset - 1;
	} else if (quadrant === 3) {
		xOffset = -xOffset;
	}
			
	// Shift back to the center of the region
	m.targetX = centerX + radius * xOffset;
	m.targetY = centerY + radius * yOffset;
}

/** Assign the mover's coordinates for a rotating circle with the given center, radius, and rotation speed */
function encircle(animationState, centerX, centerY, radius, rotationSpeed, m) {
	var angle = normInput(animationState, m.count) / animationState.movers.length * PI_2 + rotationSpeed * animationState.updateCount / 100;
	m.targetX = centerX + radius * cosine(angle);
	m.targetY = centerY + radius * sine(angle);
}

/**
 * Assign the mover's coordinates for a rotating figure eight with the given center, radius, and rotation speed
 * Note that the radius and rotationSpeed should be inversely proportional.
 * In particular, if you get an irregular loop, decrease the rotation speed
 * since most likely there are too few points (angles) representing the path
 */
function figureEight(animationState, centerX, centerY, radius, rotationSpeed, m, xStretch) {
	var angle = norm2Input(animationState, m.count) + rotationSpeed * animationState.updateCount / 100;
	m.targetX = centerX + xStretch * radius * sine(angle);
	m.targetY = centerY + radius * sine(angle) * cosine(angle);
}

function goCollectData(animationState) {
	var initialRadius = Math.min(animationState.canvasW, animationState.canvasH) / 10,
		radiusFactor = initialRadius / 4;
	
	var canvasCenterW = animationState.canvasW / 2,
		canvasCenterH = 5 * animationState.canvasH / 8;

	var i = animationState.movers.length;
	while (i-- > 0) {
		var m = animationState.movers[i];
		var radius = initialRadius - radiusFactor * (m.innerGroupType % 4);
		var offsetX = cornerPositions[m.groupType][0];
		var offsetY = cornerPositions[m.groupType][1];
		diamond(animationState, canvasCenterW + offsetX * 1.2 * initialRadius, canvasCenterH + offsetY * 1.2 * initialRadius, radius, 50, m);
	}
}

function goAnalyzeData(animationState) {
	analyze(animationState, false);
}

function goFilterData(animationState) {
	analyze(animationState, true);
}

function analyze(animationState, filter) {
	friction = 0.9;

	var initialRadius = 40,
		radiusFactor = 10,
		offset = animationState.canvasH / 4;

	var canvasCenterW = Math.floor(animationState.canvasW / 2),
		canvasCenterH = Math.floor(animationState.canvasH / 2);

	var i = animationState.movers.length;

	var count = 0;

	while (i-- > 0) {
		var m = animationState.movers[i];
		var groupType = m.groupType;
		var innerGroupType = m.innerGroupType;
		var radius = radiusFactor * (innerGroupType % 4) + initialRadius;

		var maxRadius = initialRadius + initialRadius;

		var circleX = canvasCenterW + (groupType - 1.5) * (maxRadius + offset) ;
		var circleY = animationState.canvasH / 2 + maxRadius;

		var rotationSpeed = (Math.floor(innerGroupType / 2) === 0 ? -15 : 21) * (Math.floor(groupType / 2) === 0 ? -1 : 1);

		var filtered = filter && (groupType === 1 || groupType === 2);
		if (filtered) {
			figureEight(animationState, canvasCenterW, circleY, radius, 20, m, 1);
		} else {
			encircle(animationState, circleX, circleY, radius, rotationSpeed, m);
		}
	}
	return false;
}

// Bar chart represented by the bar heights
let barHeights = randomizeBarGraph();
function randomizeBarGraph() {
	// Between 3 and 5 bars, inclusive
	var numBars = 3 + Math.floor(Math.random() * 2);

	var bars = [];
	while (numBars-- > 0) {
		var bar = Math.max(0.2, 0.8 * Math.random());
		bars.push(Math.max(0, Math.min(1, bar)));
	}

	return bars;
};

// Pi chart angles
let piAngles = randomizePiAngles();
function randomizePiAngles() {
	var numAngles = 5	;
	var angles = [];
	var avgDiff = PI_2 / numAngles;
	var idx = 0;
	while (idx++ < numAngles) {
		angles.push(idx * avgDiff + Math.random() * avgDiff);
	}
	return angles;
};

// Graphing of mini graphs, called once on each update
function grapher(animationState, miniCanvasW, miniCanvasH) {
	// Scales the index of the mover to [0, miniCanvasW]
	function scaleX (input) {
		return Math.floor(input / animationState.movers.length * miniCanvasW);
	}

	// Scales the index of the mover to [0, miniCanvasH]
	function scaleY(input) {
		return Math.floor(input / animationState.movers.length * miniCanvasH);
	}

	function getXAxis(offset) {
		return function (colorType, input) {
			return [ scaleX (input) , offset ];
		};
	}

	function getYAxis(offset) {
		return function (colorType, input) {
			return [ offset, scaleY (input) ];
		};
	}

	function cubic(colorType, input) {
		var x = scaleX (input);
		// scale x to [-2.5, 2.5]
		var input = x / miniCanvasW * 5 - 2.5;

		var y = input * input * input - 4 * input;

		// scale y from [-4, 4]
		y = (y + 4) * miniCanvasH / 10
		
		// Scale and reverse x into [0, pi], then sine
		var hide = sine(animationState.updateCount / 20 + Math.PI * ((miniCanvasW - x) / miniCanvasW)) > 0;
		
		return [ x, y, hide ];
	}

	function line(colorType, input) {
		var x = scaleX (input);
		var y = x * miniCanvasH / miniCanvasW;
		return [ x, y ];
	}

	function sineWaves(angleOffset, heightOffset) {
		return function(colorType, input) {
			var x = scaleX (input);

			// Make it wiggle!																																																																														
			var speed = 5; // increase to wiggle faster																																																																							   
			var height = miniCanvasH / 2 * (0.3 + sine(heightOffset + animationState.updateCount / 20)); // change to affect wiggle height																																																					   

			var angle = (x + (animationState.updateCount * speed % miniCanvasW)) / miniCanvasW * PI_2 + angleOffset;
			var y = height * sine(angle) + miniCanvasH / 2;
			return [ x, y ];
		};
	}

	function barChartHoriz(colorType, input) {
		var x = scaleX (input);
		var y = miniCanvasH * barHeights[ Math.floor((x / miniCanvasW) * barHeights.length) ];
		return [ x, y ];
	}

	function barChartVert(colorType, input) {
		// Use the input to find a bar index
		var barIndex = Math.floor(scaleX (input) / miniCanvasW * barHeights.length);
		// x-position is to the right of the referenced bar
		var x = (1 + barIndex) * (miniCanvasW / barHeights.length);

		// Use an alternate input to find the y-scale
		var y = Math.max(barHeights[ barIndex ], barHeights[ Math.min(barHeights.length - 1, barIndex + 1) ]) * scaleY(normInput(animationState, input));

		return [ x, y ];
	}
	
	function circles(colorType, input) {
		var orientation = (colorType % 3) - 1;
		var direction = orientation + sine(animationState.updateCount / 20);
		var circleBaseX = direction * miniCanvasW / 6;
		var circleBaseY = direction * miniCanvasH / 6;
		var radius = 0.05 * Math.min(miniCanvasW, miniCanvasH) * (3 + cosine(animationState.updateCount / 20 + orientation * PI_BY_2))
		var angle = normInput(animationState, input) / animationState.movers.length * PI_2;
		return [ radius * cosine(angle) + circleBaseX + miniCanvasW / 2, radius * sine(angle) + circleBaseY + miniCanvasH / 2];
	}

	// Each graph should start with at least two axes
	var graphs = [
		[ getXAxis(0), getYAxis(0), line, cubic ],
		[ getXAxis(miniCanvasH / 2), getYAxis(0), sineWaves(0, 0), sineWaves(Math.PI / 2, 3 * Math.PI / 8)],
		[ getXAxis(0), getYAxis(0), barChartHoriz, barChartVert],
		[ getXAxis(miniCanvasH / 2), getYAxis(miniCanvasW / 2), circles ]
	];

	/** Padding for the mini windows */
	var padding = 20;
	
	var i = animationState.movers.length;
	while (i-- > 0) {
		var m = animationState.movers[i];
		var graph = graphs[m.groupType % graphs.length];

		var series;

		// Prioritize more movers to graph non-axis
		if (graph.length > 2) {
			if (m.innerGroupType < 2) {
				series = graph[m.innerGroupType];
			} else {
				series = graph[2 + (m.innerGroupType % (graph.length - 2))];
			}
		} else {
			series = graph[m.innerGroupType % (graph.length)];
		}
		var coords = series.call(null, m.colorType, m.count);

		// Shift to appropriate region
		m.targetX = animationState.canvasW / 2 + (m.groupType - 2 + 1/4) * (miniCanvasW * 5/4) + coords[0];
		m.targetY = animationState.canvasH / 2 + padding + (miniCanvasH - coords[1]);
		
		// Hide if we're supposed to
		if (coords.length > 2) {
			m.hide = coords[2];
		}
	}

	// Occasionally update the bar height
	if (Math.floor(animationState.updateCount) % 20 === 0) {
		barHeights = randomizeBarGraph();
	}
}

// Display 4 graphs, each in a corner
function goVisualizeData(animationState) {
	friction = 0.9;

	// Size of the mini canvases
	var miniCanvasW = animationState.canvasW / 5;
	var miniCanvasH = animationState.canvasH / 4;

	grapher(animationState, miniCanvasW, miniCanvasH);

	return false;
}

/**
 * Display an image or text as given
 * @param pixelLoader Id of the lazily-loaded pixel container
 * @param asText If true, Movers displaying the image will be in white and will not overlap each other
 */
function goDisplayPixels(pixelLoader, asText) {
	return function(animationState) {
		if (!pixelLoader)
			alert("No pixel loader found, perhaps forgot to add a message or image to config?");
		
		var pixels = pixelLoader.getPixels();
		var centerX = animationState.canvasW / 2;
		var centerY = animationState.canvasH * 0.5;
		
		// Overlap each pixel with the same number of movers
		var maxMovers = pixels.length * Math.floor(animationState.movers.length / pixels.length);
		
		var i = 0;
		while (i < animationState.movers.length) {	
			var m = animationState.movers[i];
			var values = pixels[i % pixels.length];
			m.targetX = centerX + values[0];
			m.targetY = centerY + values[1];
			if (asText) {
				m.color = [204, 204, 204];
				if (i >= maxMovers) {
					m.hide = true;
				}
			}
			i++;
		}
	};
}

// Display the given text scrolling
function goDisplayScrollingText(pixelLoader, textScroller) {
	return function(animationState) {
		// Width of the window to scroll with
		var scrollWidth = 7 * animationState.canvasW / 8;
		
		var pixels = pixelLoader.getPixels();
		var bounds = pixelLoader.getBounds();
		
		var scrollSpeed = 8;
		
		var leftBorderX = animationState.canvasW / 8;
		var centerY = animationState.canvasH * 0.5;
		
		// How much the text should have shifted by in pixels
		// Start with an extra 1/4 of the window so the first words have time to settle
		var xShift = animationState.updateCount * scrollSpeed - scrollWidth / 4;
		
		// Find the start and end index we can use
		var idxStart = 0;
		while (idxStart < pixels.length
				&& pixels[idxStart][0] < bounds.minX + xShift) {
			idxStart += 1;
		}
		
		var idxEnd = idxStart;
		while (idxEnd < pixels.length
				&& pixels[idxEnd][0] < bounds.minX + xShift + scrollWidth) {
			idxEnd += 1;
		}
						
		// If we've shown the last pixel, then move to the next state 
		// Note, if you're doing message on repeat and don't want the swirly behavior, you can:
		// 1. Wait until (updateCount % pixels.length === 0), but this can take a while
		// 2. (suggested) Keep a separate independent updateCountTotal that never gets reset to be used for the figure eight position
		if (idxStart === pixels.length) {
			animationState.transition();
			return;
		}
					
		var i = 0;
		while (i < animationState.movers.length) {
			var m = animationState.movers[i];
			var idx = i;
			
			while (idx < idxStart)
				idx += animationState.movers.length;
			
			if (idx > idxEnd) {
				// Unused movers become a blue figure eight
				figureEight(animationState, animationState.canvasW / 2, centerY + 75, 20, 21 / 5, m, 12);
				m.resetColor();
			} else {
				var values = pixels[idx % pixels.length];
				m.targetX = leftBorderX + values[0] - bounds.minX - xShift;
				m.targetY = centerY + values[1];
				m.color = [204, 204, 204];
			}
			
			i++;
		}
	};
}

/**
 * @param id					Id to manipulate text displayed
 * @param highlightId			Id of the clickable button to highlight
 * @param init					Function to initialize the state
 *	In general, this will be null if you want the Movers to be static at the end of the previous state
 * @param update				Function to update the state
 *  In general, this will be non-null if you want the Movers to transition on each updateCount
 * @param destroy				Function to destroy the state
 * @param transitionDelay		Time in milliseconds before transitioning to the next state (pass in null to avoid timeout-based state transitions)
 */
var State = function(id, highlightId,
					init, update, destroy,
					transitionDelay) {
	this.id = id;
	this.highlightId = highlightId;
	this.init = init || Function.prototype;
	this.update = update || Function.prototype;
	this.destroy = destroy || Function.prototype;
	this.transitionDelay = transitionDelay;
	if (!State.initialState) {
		State.initialState = this;
	}
};

// Randomize data points
function scatter() {		
	return new State('init', null,
				explode, slowDown, null,
				2000
			);
}

// Gather into Medallia logo
function nestedDiamonds() {
	return new State('collect', 'collect',
				null, goCollectData, null,
 				6000
			);
}

// Four spinning circles
function circles() {
	return new State('analyze', 'analyze',
				null, goAnalyzeData, null,
				6000
			);
}
		
// Center circles combine to a figure eight
function circlesFigureEight() {
	return new State('clean', 'analyze',
				null, goFilterData, null,
				6000
			);
}
		
// Form into visualizations (graphs, bar charts, etc)
function display() {
	return new State('display', 'display',
				null, goVisualizeData, null,
				12000
			);
}

// Display the static text
function staticText(msg) {
	const messagePixelLoader = pixelLoader.registerText(msg, 30, 75 * msg.length, 100);
	return new State('medallia', null,
				goDisplayPixels(messagePixelLoader, true), null, null,
				8000
			);
}

// Display a scrolling text message
function scrollingText(msg) {
	if (!msg) {
		throw new Error("No message provided!");
	}
	const messagePixelLoader = pixelLoader.registerText(msg, 30, 300 * msg.length / 8, 75);
	return new State('message', null,
				null, goDisplayScrollingText(messagePixelLoader), null,
				null
			);
}

// Display the given Image object
// It is advised to fully load the image before starting animations which use it
function image(img, onload) {
	if (!img) {
		throw new Error("Must provide an image");
	}
	
	var imagePixelLoader = pixelLoader.registerImage(img, 300, 300);
	
	// Display a static image
	return new State('image', null,
				(animationState) => {
					animationState.setColors(colors.greenColors);
					goDisplayPixels(imagePixelLoader, false)(animationState);
				},
				null,
				(animationState) => {
					animationState.setColors(colors.blueColors);
				},
				6000
			);
}

/** Initialize the state transitions */
function createTransitionMap(states, repeat) {
	const nextState = {};
	for (var i = 0; i < states.length - 1; i += 1) {
		nextState[states[i].id] = states[i + 1];
	}
	
	if (repeat) {
		nextState[states[states.length - 1].id] = states[0];
	}
	
	return nextState;
}

const examples = {
	scatter: scatter,
	nestedDiamonds: nestedDiamonds,
	circles: circles,
	circlesFigureEight: circlesFigureEight,
	display: display,
	image: image,
	scrollingText: scrollingText,
	staticText: staticText
}

module.exports = {
	State: State,
	examples: examples,
	createTransitionMap: createTransitionMap
}