/**
 * Controller which handles animation requests
 * To use this, simply call register with a function, it's name and a delay in ms
 * When all functions have been registered, call animate
 */

var _ = require('underscore');

// Set the request animation function which is browser-specific
var requestAnimFrame = (function() {
		return window.requestAnimationFrame ||
			   window.webkitRequestAnimationFrame ||
			   window.mozRequestAnimationFrame ||
			   window.oRequestAnimationFrame ||
			   window.msRequestAnimationFrame ||
			   function(callback, element) {
				   window.setTimeout(callback, 1000/60);
			   };
	})();

var registered = [];
var lastTriggered = {};
var requestIdCallback = null;
var stopped = false;
var animationFrameRequestId = undefined;

function start() {
	const curTime = new Date().getTime();
	for (var registeredFunction of registered) {
		if (curTime > registeredFunction.lastTriggered + registeredFunction.delay) {
			registeredFunction.func.call();
			registeredFunction.lastTriggered = curTime;
		}
	}
	
	if (!stopped) {
		animationFrameRequestId = requestAnimationFrame(animator.start);
	} else if (animationFrameRequestId) {
		cancelAnimationFrame(animationFrameRequestId);
		animationFrameRequestId = undefined;
	}
}

var animator = {
	start: start,
	stop: () => {
		stopped = true;
	},
	register: (name, func, delay) => {
		registered.push({
			name: name,
			func: func,
			delay: delay,
			lastTriggered: new Date().getTime()
		});
	}
};

module.exports = animator;
