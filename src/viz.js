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
	 * Callback function to be called before a state is initialized
	 * The state id is passed as the sole parameter
	 */
	transitionInCallback: Function.prototype,
	
	/**
	 * Callback function to be called after a state is destroyed
	 * The state id is passed as the sole parameter
	 */
	transitionOutCallback: Function.prototype,
	
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
	
	/**
	 * Canvas object to manipulate
	 */
	canvas: null,
	
	/** Scale */
	scale: 1.0
};

/**
 * @param config
 */
function animate(config) {	
	var animationState = {
		/** How many times the animation has started from the initial state */
		animationCount: 0,
		/** Time since the state began */
		updateDelta: 0,
		/* Delta since state started */
		updateCount: 0,
		/** Current state */
		currentState: null,
		/** Time that the state began */
		stateStartTime: Date.now(),
		/** Map from each state's id to the following state */
		nextState: {},
		/** All movers */
		movers: movers.movers,
		/** Function which states can call to transition to the next state */
		transition: transition,
		/** Friction coeff */
		friction: 0.9,
		/** Set new colors */
		setColors: setColors,
		/** Set new colors */
		resetColors: movers.resetColors
	};
	
	config = _.extend(defaultConfig, config);

	/** Store the canvas and it's sizes */
	var canvas = config.canvas;
	
	if (config.blowEnabled) {
		config.blower = blower.getDefaultBlower(canvas, config.scale)
	}
	
	/* Id returned by timeout function */
	var stateTimeoutId;
	
	/** Initialize the entire animation */
	function init() {
		$(function() {
            canvas = config.canvas;
             
			// Initialize states
			initStates();
			
			// Resize the canvas to the scale
			animationState.canvasW = canvas.offsetWidth / config.scale;
			animationState.canvasH = canvas.offsetHeight / config.scale;
			canvas.width = animationState.canvasW;
			canvas.height = animationState.canvasH;	

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
		animator.register("updateMovers", () => {
			movers.updatePosition(animationState, config.blower);
			config.renderer.render(movers.movers);
		}, 33);
		animator.register("updateState", updateState, 100);

		// Go to the first state
		goToState(config.states[0]);

		animator.animate();
	}
	
	function setColors(baseColors) {
		colors.setColors(baseColors);
		movers.resetColors();
	}
	
	/** Set the initial positions of the movers (each dot) */
	function initMovers(){
		setColors(colors.blueColors);
		
		var i = config.renderer.numMovers;
		while ( i-- ){
			var m = new movers.Mover();
			m.x   = animationState.canvasW * 0.5;
			m.y   = animationState.canvasH * 0.5;
			m.vX  = Math.cos(i) * Math.random() * 34;
			m.vY  = Math.cos(i) * Math.random() * 34;
			m.targetX = Math.random() * animationState.canvasW;
			m.targetY = Math.random() * animationState.canvasH;
			animationState.movers[i] = m;
		}
	}
	
	function initStates() {
		animationState.nextState = new Map();
		for (var i = 0; i < config.states.length - 1; i += 1) {
			animationState.nextState[config.states[i].id] = config.states[i + 1];
		}
		
		if (config.repeat) {
			animationState.nextState[config.states[config.states.length - 1].id] = config.states[0];
		}
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
		clearTimeout(stateTimeoutId);
		stateTimeoutId = null;
		
		// Clean up from the last state, but only if there is a next state to go to
		if (animationState.currentState) {
			animationState.currentState.destroy(animationState);
			
			// Trigger callback for exiting old state
			config.transitionOutCallback(animationState.currentState.id);
		}
		
		// Reset the update count for the new state
		animationState.stateStartTime = Date.now();
		
		// Set the new state
		animationState.currentState = state;
		
		// Trigger callback for entering new state
		config.transitionInCallback(animationState.currentState.id);
		
		// Initialize the new state
		animationState.currentState.init(animationState);
		
		// Set up the next state transition
		if (animationState.currentState.transitionDelay) {
			stateTimeoutId = setTimeout(transition, animationState.currentState.transitionDelay);
		}
	}

	function updateState() {
		animationState.updateDelta = Date.now() - animationState.stateStartTime;
		animationState.updateCount = animationState.updateDelta / 100 - 6;
//		console.log(updateCount + " " + (updateDelta / 100));
		if (!animationState.currentState) {
			return;
		}
		if (animationState.currentState.update != null) {
			animationState.currentState.update(animationState);
		}
	}
		
	return {
		start: init,
		stop: stop
	};
};

module.exports = {
	animate: animate,
	states: states
};