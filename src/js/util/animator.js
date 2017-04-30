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
var state = {};

var animator = {
	animate : function() {
		var curTime = new Date().getTime();
			_.each(registered, function(wrapper) {
					if (curTime > state[wrapper[0]] + wrapper[2]) {
						wrapper[1].call();
						state[wrapper[0]] = curTime;
					}
				});
			requestAnimFrame(animator.animate);
		},
		register : function(name, func, delay) {
			registered.push([name, func, delay]);
			state[name] = new Date().getTime();
		}
};

module.exports = animator;
