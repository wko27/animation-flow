/**
 * Medallia Engineering Animation
 * Inspired by �2010 spielzeugz.de
 */

const $ = require('jquery'),
	_ = require('underscore'),
	pixelLoader = require('./util/pixelLoader'),
	animator = require('./util/animator'),
	render = require('./util/render'),
	blower = require('./util/blower'),
	movers = require('./movers'),
	states = require('./states'),
	colors = require('./colors');

const defaultConfig = {
	/** DOM element to attach a canvas */
	domElement: null,
	
	/** Width of the canvas */
	width: 0,
	
	/** Height of the canvas */
	height: 0,
	
	/** States to display */
	states: [],
	
	/** Whether to loop back to initial state after animation completes */
	repeat: false,
	
	/** Set to a wrapper with a pause value to control pausing the state transitions */
	controller: null,
	
	/**
	 * Callback function to be called after the rest of the animation is initialized
	 * This callback is passed a goToState function which can be used to transition states
	 */
	initCallback: null,
	
	/**
	 * Renderer responsible for rendering the Mover objects
	 * By default, we will try using webGL, and fall back to HTML5 canvas if not supported
	 * To force, use either 'webgl', or 'canvas'
	 */
	renderer: null,
	
	/**
	 * Enables blowback via mouse clicks
	 */
	blowEnabled: true,
	
	/** Scale */
	scale: 1.0
};

/**
 * @param config
 */
function animate(config) {	
	// State of the animation (which can change over time)
	const animationState = {
		/** How many times the animation has started from the initial state */
		animationCount: 0,
		/** Time since the state began */
		updateDelta: 0,
		/* Delta since state started */
		updateCount: 0,
		/** All movers */
		movers: movers.movers,
		/** Function which states can call to transition to the next state */
		transition: transition,
		/** Friction coeff */
		friction: 0.9,
		/** Set new colors */
		setColors: setColors,
		/** Set new colors */
		resetColors: movers.resetColors,
		
		/** Current state */
		currentState: null,
		/** Time that the state began */
		stateStartTime: Date.now(),
		/** Map from each state's id to the following state */
		nextState: {},
		
		/** Timeout id for transitioning to the next state */
		stateTimeoutId: null,
		/** Animation frame request id for updating movers and states */
		animationFrameRequestId: null,
	};
	
	config = _.extend(defaultConfig, config);
	
	/* Id returned by timeout function */
	var stateTimeoutId;
	
	/** Initialize the entire animation */
	function init() {
		$(function() {
			const canvas = document.createElement("canvas");
			config.canvas = canvas;
			config.domElement.appendChild(canvas);
			canvas.style.top = 0;
			canvas.style.left = 0;
			canvas.style.position = "absolute";

			canvas.width = config.width;
			canvas.height = config.height;
            
            // Resize the canvas to scale
			animationState.canvasW = canvas.offsetWidth / config.scale;
			animationState.canvasH = canvas.offsetHeight / config.scale;
			
			// Register mouse blowback listeners
			if (config.blowEnabled) {
				config.blower = blower.getDefaultBlower(canvas, config.scale)
			}
 
			// Initialize states
			animationState.nextState = states.createTransitionMap(config.states, config.repeat);
			
			// Initialize the renderer
			config.renderer = render.getRenderer(config.renderer, canvas);

			// Set initial colors
			setColors(colors.blueColors);
			
			// Initialize the movers
			movers.initialize(animationState, config.renderer.numMovers);
			
			// Go to the first state
			goToState(config.states[0]);
			
			// Register the animation frame requests
			initAnimationFrameRequests();
			
			if (config.initCallback) {
				config.initCallback(goToState);
			}
			
			// If a state transition occurs before this is called requiring the image load, it will be done on demand instead
			pixelLoader.loadLazy();
		});
	}
	
	/** Initialize the frame requests */
	function initAnimationFrameRequests() {
		animator.register("updateMovers", () => {
			movers.updatePosition(animationState, config.blower);
			config.renderer.render(movers.movers);
		}, 33);
		
		animator.register("updateState", updateState, 100);
		
		animator.start();
	}
	
	function setColors(baseColors) {
		colors.setColors(baseColors);
		movers.resetColors();
	}
	
	/** Function which moves the current state */
	function transition() {
		if (config.controller && config.controller.paused) {
			// Check again in a second
			stateTimeoutId = setTimeout(transition, 1000);
			return;
		}
		
		var nextState = animationState.nextState[animationState.currentState.id];
		if (nextState != null) {
			goToState(nextState);
		}
	}
	
	/** Go to the given state */
	function goToState(state) {
		// Clear out any preset timeouts
		clearTimeout(animationState.stateTimeoutId);
		animationState.stateTimeoutId = null;
		
		// Clean up from the last state, but only if there is a next state to go to
		if (animationState.currentState) {
			animationState.currentState.destroy(animationState);
			animationState.currentState.postDestroy(animationState);
		}
		
		// Reset the update count for the new state
		animationState.stateStartTime = Date.now();
		
		// Set the new state
		animationState.currentState = state;
		
		// Initialize the new state
		animationState.currentState.preInit(animationState);
		animationState.currentState.init(animationState);
		
		// Set up the next state transition
		if (animationState.currentState.transitionDelay) {
			animationState.stateTimeoutId = setTimeout(transition, animationState.currentState.transitionDelay);
		}
	}

	function updateState() {
		animationState.updateDelta = Date.now() - animationState.stateStartTime;
		animationState.updateCount = animationState.updateDelta / 100 - 6;
		if (!animationState.currentState) {
			return;
		}
		if (animationState.currentState.update != null) {
			animationState.currentState.update(animationState);
		}
	}
	
	function stop() {
		// Stop requesting animation frames (updating movers and states)
		animator.stop();
		
		// Stop transitioning states
		clearTimeout(animationState.stateTimeoutId);
		
		// Remove the created canvas
		config.domElement.removeChild(config.canvas);
	}
		
	return {
		start: init,
		stop: stop
	};
};

module.exports = {
	animate: animate,
	State: states.State,
	examples: states.examples
};