/**
 * Medallia Engineering Animation
 * Inspired by �2010 spielzeugz.de
 */

var $ = require('jquery'),
	_ = require('underscore'),
	pixelLoader = require('./util/pixelLoader'),
	animator = require('./util/animator'),
	render = require('./util/render'),
	blower = require('./util/blower');

var defaultConfig = {
	/** Whether to loop back to initial state after animation completes */
	repeat : false,
	
	/** An Image object */
	image : null,
	
	/** A message to display */
	message : null,
	
	/** Set to a wrapper with a pause value to control pausing the state transitions */
	controller : null,
	
	/** Default states to display */
	states : [],
	
	/**
	 * Callback function to be called after the rest of the animation is initialized
	 * This callback is passed a goToState function which can be used to transition states
	 */
	initCallback : null,
	
	/**
	 * Callback function to be called before a state is initialized
	 * The state id is passed as the sole parameter
	 */
	transitionInCallback : null,
	
	/**
	 * Callback function to be called after a state is destroyed
	 * The state id is passed as the sole parameter
	 */
	transitionOutCallback : null,
	
	/**
	 * Callback function to display messages
	 * Takes in a single parameter, the message to display
	 */
	messageCallback : function(msg) { console.log(msg); },
	
	/**
	 * Renderer responsible for rendering the Mover objects
	 * By default, we will try using webGL, and fall back to HTML5 canvas if not supported
	 * To force, use either 'webgl', or 'canvas'
	 */
	renderer : null,
	
	/**
	 * Controller for blowback via mouse clicks
	 * See getDefaultBlower
	 */
	blower : null,
	
	/**
	 * Canvas object to manipulate
	 */
	canvas : null,
	
	/** Scale */
	scale : 1,

	/** Maximum number of times to run animation before reloading the page */
	reloadCount : 5,
};

/**
 * @param config
 */
function animate(config) {
	
	var initialized = false;
	
	config = _.extend(defaultConfig, config);
	
	var cosine = getCache(Math.cos);
	var sine  = getCache(Math.sin);
	
	function getCache(f) {
		var cache = {};
		return function(input) {
			if (!(cache.hasOwnProperty(input))) {
				cache[input] = f(input);
			}
			return cache[input];
		};
	}
	
	var currentState = null;
	
	/** How many times the animation has started from the initial state */
	var animationCount = 0;
	
	/** Useful constants */
	var PI_2		= Math.PI * 2;
	var PI_BY_2	 = Math.PI / 2;

	/** Store the canvas and it's sizes */
	var canvas = config.canvas;
	var canvasW;
	var canvasH;
	
	if (config.blowEnabled) {
		config.blower = blower.getDefaultBlower(canvas, config.scale)
	}
	
	/** Should probably go into the config, or at least modifiers */
	var friction	= 0.9;
	var movers	  = [];

	/* Delta since state started */
	var updateCount = 0;
	/** Time since the state began */
	var updateDelta = 0;
	/** Time that the state began */
	var stateStartTime = Date.now();
	
	/* Id returned by timeout function */
	var stateTimeoutId;
	
	/** @return State corresponding to the given id */
	function getState(stateId) {
		return State.states[stateId];
	}
	
	/**
	 * @param id					Id to manipulate text displayed
	 * @param highlightId			Id of the clickable button to highlight
	 * @param init					Function to initialize the state
	 *	In general, this will be null if you want the Movers to be static at the end of the state
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
		this.init = init;
		this.update = update;
		this.destroy = destroy;
		this.transitionDelay = transitionDelay;
		State.states[id] = this;
		if (!State.initialState) {
			State.initialState = this;
		}
	};
	
	State.states = {};
	
	function initStates() {
		
		// Append the image if desired
		if (_.contains(config.states, 'image') && !config.image)
				throw new Error("No image provided!");

		if (_.contains(config.states, 'message') && !config.message)
				throw new Error("No message provided!");
		
		// Randomize data points
		new State('init', null,
					function() {
						explode();
						animationCount = animationCount + 1;
						if (animationCount >= config.reloadCount) {
							reload();
						}
					},
					slowDown,
					null,
					2000
				);
		
		// Gather into Medallia logo
		new State('collect', 'collect',
					null, goCollectData, null,
					6000
				);
		
		// Four spinning circles
		new State('analyze', 'analyze',
					null, goAnalyzeData, null,
					6000
				);
		
		// Center circles combine to a figure eight
		new State('clean', 'analyze',
					null, goFilterData, null,
					6000
				);
		
		// Form into visualizations (graphs, bar charts, etc)
		new State('display', 'display',
					null, goVisualizeData, null,
					12000
				);
		
		// Display the static text Medallia
		new State('medallia', null,
					goDisplayPixels(medalliaPixelLoader, true), null, resetColors,
					8000
				);
		
		// Display a static image
		new State('image', null,
					function() {
						setColors(Mover.greenColors);
						resetColors();
						goDisplayPixels(imagePixelLoader, false)();
					},
					null,
					function() {
						setColors(Mover.blueColors);
						resetColors();
					},
					6000
				);
		
		// Display a scrolling text message
		new State('message', null,
					null, goDisplayScrollingText(messagePixelLoader), resetColors,
					null
				);
		
		for (var i = 0; i < config.states.length - 1; i += 1)
			getState(config.states[i]).next = config.states[i + 1];
		
		if (config.repeat)
			getState(config.states[config.states.length - 1]).next = config.states[0];
	}
	
	function reload() {
		window.location.reload(false);
	}
	
	/** Initialize the entire animation */
	function init() {
		$(function() {
            canvas = config.canvas;
                         
			// Initialize states
			initStates();
			
			// Resize the canvas to the scale
			canvasW = canvas.offsetWidth / config.scale;
			canvasH = canvas.offsetHeight / config.scale;
			canvas.width = canvasW;
			canvas.height = canvasH;	

			// Initialize the renderer
			config.renderer = render.getRenderer(config.renderer, canvas);

			// Initialize the movers
			initMovers();
			
			// Register the animation frame requests
			initFrameRequest();
			
			if (config.initCallback) {
				config.initCallback(goToState);
			}
			
			// If a state transition occurs before this is called requiring the image load, it will be done on demand instead
			pixelLoader.loadLazy();
		});
	}
	
	/** Initialize the frame requests */
	function initFrameRequest() {
		animator.register("updateMovers", updateMovers, 33);
		animator.register("updateState", updateState, 100);

		// Go to the first state
		goToState(config.states[0]);

		animator.animate();
	}
	
	/** Set the initial positions of the movers (each dot) */
	function initMovers(){
		var i = config.renderer.numMovers;
		while ( i-- ){
			var m = new Mover();
			m.x   = canvasW * 0.5;
			m.y   = canvasH * 0.5;
			m.vX  = cosine(i) * Math.random() * 34;
			m.vY  = cosine(i) * Math.random() * 34;
			m.targetX = Math.random() * canvasW;
			m.targetY = Math.random() * canvasH;
			movers[i] = m;
		}
	}
		
	/** Updates the state of each mover */
	function updateMovers() {
		var toDist = canvasW * 0.86;
		
		var Mrnd = Math.random;
		var Mabs = Math.abs;

		var i = config.renderer.numMovers;
		
		var blower = config.blower;
		var blowing = blower && blower.blowing;
		var blowX = blower && blower.blowX;
		var blowY = blower && blower.blowY;
		var blowDist = canvasW;
		
		while ( i-- ){
			var m  = movers[i];
					
			var x  = m.x;
			var y  = m.y;
			var vX = m.vX;
			var vY = m.vY;
			
			var dX = x - m.targetX;
			var dY = y - m.targetY;
			var d  = Math.sqrt( dX * dX + dY * dY ) || 0.001;
			dX /= d;
			dY /= d;
			
			if (!m.fixed && blowing) {
				blowDx = x - blowX;
				blowDy = y - blowY;
				var blowD = blowDx * blowDx + blowDy * blowDy;
				if ( blowD < blowDist ){
					var blowAcc = ( 1 - ( d / blowDist ) ) * 14;
					vX += dX * blowAcc + 0.5 - Mrnd();
					vY += dY * blowAcc + 0.5 - Mrnd();
				}
			}

			if ( d < toDist ){
				var toAcc = ( 1 - ( d / toDist ) ) * 1.12;
				vX -= dX * toAcc;
				vY -= dY * toAcc;
			}
			
			vX *= friction;
			vY *= friction;

			// Size of the pixel to display
			// TODO: Make this variable ...
			// Specifically, we need to scale the input (0, +inf) to (min, max) as provided by the config
			var size = ( Mabs( vX ) + Mabs( vY ) ) * 1.5; // 1.5 is the speedSizeRatio
			
			// Scale to between [2, 3]
			if ( size > 3 ) {
				size = 3;
			} else if ( size < 2 ) {
				size = 2;
			}
			
			var nextX = x + vX;
			var nextY = y + vY;

			if ( nextX > canvasW ) {
				nextX = canvasW;
				vX *= -1;
			}
			else if ( nextX < 0 ) {
				nextX = 0;
				vX *= -1;
			}

			if ( nextY > canvasH ) {
				nextY = canvasH;
				vY *= -1;
			}
			else if ( nextY < 0 ) {
				nextY = 0;
				vY *= -1;
			}

			m.vX = vX;
			m.vY = vY;
			m.x  = nextX;
			m.y  = nextY;
			m.size = size;

			if (m.hide) {
				continue;
			}
			
			if (m.fixed) {
				m.x = m.targetX;
				m.y = m.targetY;
			}
		}
		
		config.renderer.render(movers);
	}
	
	/** Function which moves the current state */
	function transition() {
		if (config.controller && config.controller.paused) {
			// Check again in a second
			stateTimeoutId = setTimeout(transition, 1000);
			return;
		}
		
		var nextStateId = currentState.next;
		
		if (nextStateId != null)
			goToState(nextStateId);
	}
	
	/** Go to the given state */
	function goToState(stateId) {
		var state = getState(stateId);
		
		// Clear out any preset timeouts
		clearTimeout(stateTimeoutId);
		stateTimeoutId = null;
		
		// Clean up from the last state, but only if there is a next state to go to
		if (currentState) {
			if (currentState.destroy) {
				currentState.destroy();
			}
			
			if (config.transitionOutCallback) {
				config.transitionOutCallback(currentState.id);
			}
		}
		
		// Reset the update count for the new state
		stateStartTime = Date.now();
		
		// Set the new state
		currentState = state;
		
		// Bring in the next text
		if (config.transitionInCallback) {
			config.transitionInCallback(currentState.id);
		}
		
		// Initialize the new state
		if (currentState.init) {
			currentState.init();
		}
		
		// Set up the next state transition
		if (currentState.transitionDelay)
			stateTimeoutId = setTimeout(transition, currentState.transitionDelay);
	}

	function updateState() {
		updateDelta = Date.now() - stateStartTime;
		updateCount = updateDelta / 100 - 6;
//		console.log(updateCount + " " + (updateDelta / 100));
		if (!currentState) {
			return;
		}
		if (currentState.update != null) {
			currentState.update();
		}
	}
	
	function resetColors() {
		var i = movers.length;
		while (i-- > 0) {
			var m = movers[i];
			m.resetColor();
			m.hide = false;
			m.fixed = false;
		}
	}
	
	function speedUp() {
		friction = 1.0;
	}
	
	function slowDown() {
		friction = 0.9;
	}
	
	function explode() {
		friction = 1;
		var i = movers.length;
		while (i-- > 0) {
			var m = movers[i];
			m.vX  = cosine(i) * (Math.random() - 0.5) * 70;
			m.vY  = cosine(i) * (Math.random() - 0.5) * 70;
			m.targetX = Math.random() * canvasW;
			m.targetY = Math.random() * canvasH;
		}
	}
	
	function normInput(input) {
		return 31 * input % movers.length;
	}
	
	function norm2Input(input) {
		return 17 * input % movers.length;
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
	
	function diamond(centerX, centerY, radius, rotationSpeed, m) {
		var angle = ((normInput(m.count) + updateCount * rotationSpeed) % movers.length) / movers.length * PI_2;
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
	function encircle(centerX, centerY, radius, rotationSpeed, m) {
		var angle = normInput(m.count) / movers.length * PI_2 + rotationSpeed * updateCount / 100;
		m.targetX = centerX + radius * cosine(angle);
		m.targetY = centerY + radius * sine(angle);
	}
	
	/**
	 * Assign the mover's coordinates for a rotating figure eight with the given center, radius, and rotation speed
	 * Note that the radius and rotationSpeed should be inversely proportional.
	 * In particular, if you get an irregular loop, decrease the rotation speed
	 * since most likely there are too few points (angles) representing the path
	 */
	function figureEight (centerX, centerY, radius, rotationSpeed, m, xStretch) {
		var angle = norm2Input(m.count) + rotationSpeed * updateCount / 100;
		m.targetX = centerX + xStretch * radius * sine(angle);
		m.targetY = centerY + radius * sine(angle) * cosine(angle);
	}
	
	function goCollectData() {
		var initialRadius = Math.min(canvasW, canvasH) / 10,
			radiusFactor = initialRadius / 4;
		
		var canvasCenterW = canvasW / 2,
			canvasCenterH = 5 * canvasH / 8;

		var i = movers.length;
		while (i-- > 0) {
			var m = movers[i];
			var radius = initialRadius - radiusFactor * (m.innerGroupType % 4);
			var offsetX = cornerPositions[m.groupType][0];
			var offsetY = cornerPositions[m.groupType][1];
			diamond(canvasCenterW + offsetX * 1.2 * initialRadius, canvasCenterH + offsetY * 1.2 * initialRadius, radius, 50, m);
		}
	}

	function goAnalyzeData() {
		analyze(false);
	}
	
	function goFilterData() {
		analyze(true);
	}
	
	function analyze(filter) {
		friction = 0.9;

		var initialRadius = 40,
			radiusFactor = 10,
			offset = canvasH / 4;

		var canvasCenterW = Math.floor(canvasW / 2),
			canvasCenterH = Math.floor(canvasH / 2);

		var i = movers.length;

		var count = 0;

		while (i-- > 0) {
			var m = movers[i];
			var groupType = m.groupType;
			var innerGroupType = m.innerGroupType;
			var radius = radiusFactor * (innerGroupType % 4) + initialRadius;

			var maxRadius = initialRadius + initialRadius;

			var circleX = canvasCenterW + (groupType - 1.5) * (maxRadius + offset) ;
			var circleY = canvasH / 2 + maxRadius;

			var rotationSpeed = (Math.floor(innerGroupType / 2) === 0 ? -15 : 21) * (Math.floor(groupType / 2) === 0 ? -1 : 1);

			var filtered = filter && (groupType === 1 || groupType === 2);
			if (filtered) {
				figureEight(canvasCenterW, circleY, radius, 20, m, 1);
			} else {
				encircle (circleX, circleY, radius, rotationSpeed, m);
			}
		}
		return false;
	}

	// Bar chart represented by the bar heights
	var barHeights = randomizeBarGraph();
	function randomizeBarGraph() {
		// Between 3 and 5 bars, inclusive
		var numBars = 3 + Math.floor(Math.random() * 2);

		var bars = [];
		while (numBars-- > 0) {
			var bar = Math.max(0.2, 0.8 * Math.random());
			bars.push(Math.max(0, Math.min(1, bar)));
		}

		return bars;
	}

	// Pi chart angles
	var piAngles = randomizePiAngles();
	function randomizePiAngles() {
		var numAngles = 5	;
		var angles = [];
		var avgDiff = PI_2 / numAngles;
		var idx = 0;
		while (idx++ < numAngles) {
			angles.push(idx * avgDiff + Math.random() * avgDiff);
		}
		return angles;
	}

	// Graphing of mini graphs, called once on each update
	function grapher(miniCanvasW, miniCanvasH) {
		// Scales the index of the mover to [0, miniCanvasW]
		function scaleX (input) {
			return Math.floor(input / movers.length * miniCanvasW);
		}

		// Scales the index of the mover to [0, miniCanvasH]
		function scaleY(input) {
			return Math.floor(input / movers.length * miniCanvasH);
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
			var hide = sine(updateCount / 20 + Math.PI * ((miniCanvasW - x) / miniCanvasW)) > 0;
			
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
				var height = miniCanvasH / 2 * (0.3 + sine(heightOffset + updateCount / 20)); // change to affect wiggle height																																																					   

				var angle = (x + (updateCount * speed % miniCanvasW)) / miniCanvasW * PI_2 + angleOffset;
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
			var y = Math.max(barHeights[ barIndex ], barHeights[ Math.min(barHeights.length - 1, barIndex + 1) ]) * scaleY ( normInput( input ) );

			return [ x, y ];
		}
		
		function circles(colorType, input) {
			var orientation = (colorType % 3) - 1;
			var direction = orientation + sine(updateCount / 20);
			var circleBaseX = direction * miniCanvasW / 6;
			var circleBaseY = direction * miniCanvasH / 6;
			var radius = 0.05 * Math.min(miniCanvasW, miniCanvasH) * (3 + cosine(updateCount / 20 + orientation * PI_BY_2))
			var angle = normInput(input) / movers.length * PI_2;
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
		
		var i = movers.length;
		while (i-- > 0) {
			var m = movers[i];
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
			m.targetX = canvasW / 2 + (m.groupType - 2 + 1/4) * (miniCanvasW * 5/4) + coords[0];
			m.targetY = canvasH / 2 + padding + (miniCanvasH - coords[1]);
			
			// Hide if we're supposed to
			if (coords.length > 2) {
				m.hide = coords[2];
			}
		}

		// Occasionally update the bar height
		if (Math.floor(updateCount) % 20 === 0) {
			barHeights = randomizeBarGraph();
		}
	}

	// Display 4 graphs, each in a corner
	function goVisualizeData () {
		friction = 0.9;

		// Size of the mini canvases
		var miniCanvasW = canvasW / 5;
		var miniCanvasH = canvasH / 4;

		grapher(miniCanvasW, miniCanvasH);

		return false;
	}

	// scroll down :)
	function goOnReading () {
		$('.fixedscroller-inner').scrollintoview({direction: "vertical"});
	}
	
	/**
	 * Display an image or text as given
	 * @param pixelLoader Id of the lazily-loaded pixel container
	 * @param asText If true, Movers displaying the image will be in white and will not overlap each other
	 */
	function goDisplayPixels(pixelLoader, asText) {
		return function() {
			if (!pixelLoader)
				alert("No pixel loader found, perhaps forgot to add a message or image to config?");
			
			var pixels = pixelLoader.getPixels();
			var centerX = canvasW / 2;
			var centerY = canvasH * 0.5;
			
			// Overlap each pixel with the same number of movers
			var maxMovers = pixels.length * Math.floor(movers.length / pixels.length);
			
			var i = 0;
			while (i < movers.length) {
				var m = movers[i];
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
		}
	}
	
	// Display the given text scrolling
	function goDisplayScrollingText(pixelLoader, textScroller) {
		return function() {
			// Width of the window to scroll with
			var scrollWidth = 7 * canvasW / 8;
			
			var pixels = pixelLoader.getPixels();
			var bounds = pixelLoader.getBounds();
			
			var scrollSpeed = 8;
			
			var leftBorderX = canvasW / 8;
			var centerY = canvasH * 0.5;
			
			// How much the text should have shifted by in pixels
			// Start with an extra 1/4 of the window so the first words have time to settle
			var xShift = updateCount * scrollSpeed - scrollWidth / 4;
			
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
				transition();
				return;
			}
						
			var i = 0;
			while (i < movers.length) {
				var m = movers[i];
				var idx = i;
				
				while (idx < idxStart)
					idx += movers.length;
				
				if (idx > idxEnd) {
					// Unused movers become a blue figure eight
					figureEight(canvasW / 2, centerY + 75, 20, 21 / 5, m, 12);
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
	
	function Mover () {
		this.count = ++Mover.count;
		this.type1 = this.count % Mover.numType1Types;
		this.type2 = this.count % Mover.numType2Types;

		// 36 color types
		this.colorType = this.count % Mover.numColors;

		// 4 group types
		this.groupType = this.colorType % 4;

		// 9 inner group types
		this.innerGroupType = Math.floor(this.colorType / 4);

		// RGB values as an array with values in [0, 255]
		this.color = Mover.Colors[this.colorType];
		
		// Function to reset the original color
		this.resetColor = function() {
			this.color = Mover.Colors[this.colorType];
		};
		
		this.hide = false;
		this.fixed = false;
		
		this.x	 = 0;
		this.y	 = 0;
		this.vX	= 0;
		this.vY	= 0;
		this.size  = 1;
		this.targetX = 0;
		this.targetY = 0;
	}

	Mover.count = 0;
	Mover.numType1Types = 4;
	Mover.numType2Types = 7;
	Mover.numColors = 36;
	
	// TODO: Clean this up so we obtain the colors from the image and use them instead ...
	Mover.blueColors = ["013459", "0d2a75", "333333", "666666"];
	Mover.greenColors = ["00C957", "008B00", "333333", "666666"];
	
	setColors(Mover.blueColors);
	
	function setColors(baseColors) {
		Mover.Colors = createColorDistribution(baseColors, Mover.numColors, 0, 1);
	}

	function createColorDistribution(baseColors, numColors, minLum, maxLum) {
		var quantityPerColor = numColors / baseColors.length;
		var lumDelta = (maxLum - minLum) / Math.floor(quantityPerColor);
		var lums = [];
		var colors = [];

		for(var i = minLum; i <= maxLum; i += lumDelta) {
			lums.push(Math.round(i*100)/100);
		}

		for(var j = 0; j < baseColors.length; j++) {
			for(var k = 0; k < lums.length; k++) {
				colors.push(generateLumVariation(baseColors[j], lums[k]));
			}
		}

		return colors;
	}

	function generateLumVariation(hex, lum) {
		lum = lum || 0;
		var rgb = [];
		var c, i;
		for (i = 0; i < 3; i++) {
			c = parseInt(hex.substr(i*2,2), 16);
			rgb.push(Math.round(Math.min(Math.max(0, c + (c * lum)), 255)));
		}
		return rgb;
	}
	
	// Register the Medallia text
	var medalliaPixelLoader = pixelLoader.registerText("MEDALLIA", 30, 600, 100);
	
	// Register a message to display if desired
	var messagePixelLoader;
	if (config.message) {
		messagePixelLoader = pixelLoader.registerText(config.message, 30,
			300 * config.message.length / 8, 75);
	}
	
	// Register the image if desired
	var imagePixelLoader;
	if (config.image) {
		var image = new Image();
			image.src = config.image;
			image.onload = init;
			config.image = image;
		imagePixelLoader = pixelLoader.registerImage(config.image, 300, 300);
	} else {
		init();
	}
};

module.exports = {
	animate: animate
};