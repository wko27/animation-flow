var requireConfig = {
	baseUrl: "js",
	shim: {
		'underscore': {
			exports: '_'
		},
		'jquery' : {
			exports : '$'
		},
	},
	paths: {
		text: 'libs/text',
		jquery: 'libs/jquery.min',
		underscore: 'libs/underscore',
		viz: 'viz',
		scripts: 'scripts',
		webgl_utils: 'util/webgl',
		animator: 'util/animator',
		pixelLoader: 'util/pixelLoader',
		render: 'util/render',
		blower: 'util/blower'
	},
	config: {
		text: {
			useXhr: function (url, protocol, hostname, port) {
				// Needs to be true else shaders need to have js appended to filenames
				// This is really funky behavior ... noext.js and text.js are requirejs plugins that are supposed to take care of this issue and fail to do so
				// Mickey will fix this ...
				return true;
			}
		}
	}
};

var viz = require('./viz');
var blower = require('./util/blower');
var $ = require('jquery');

$(function() {
	var transitionHighlights = {
		collect : "collect",
		analyze : "analyze",
		clean : "analyze",
		display : "display"
	};
	var canvas = document.getElementById("mainCanvas");
	var scale = 1.0;
	viz.animate({
		states : ['init', 'collect', 'analyze', 'clean', 'display', 'medallia', 'image'],
		repeat : true,
		image : "public/images/sthacktrix.jpg",
		initCallback : function(goToState) {
			// Register visualization controls
			$('.viz-control').bind('click', function(){
				var id = $(this).attr('id').split('-')[0];
				goToState(id);
			});
		},
		transitionOutCallback : function(oldStateId) {
			if (oldStateId in transitionHighlights) {
				// Fade out the last explanation, and unhighlight the appropriate control
				$('#' + oldStateId + '-explanation').fadeOut(100);
				$('#' + transitionHighlights[oldStateId] + '-control').removeClass("viz-control-active");
			}
		},
		transitionInCallback : function(newStateId) {
			if (newStateId in transitionHighlights) {
				// Fade in the new explanation, and highlight the appropriate control
				$('#' + newStateId + '-explanation').animate('opacity',150).fadeIn(500);
				$('#' + transitionHighlights[newStateId] + '-control').addClass("viz-control-active");
			}
		},
		blower : blower.getDefaultBlower(canvas, scale),
		canvas : canvas,
		scale: scale,
	});
}); // dom ready