require.config({
	baseUrl: "js",
	shim: {
		'underscore': {
			exports: '_'
		},
		'jquery' : {
			exports : '$'
		}
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
});

require(['viz', 'blower', 'jquery', 'ui/scripts', 'ui/plugins', 'ui/scrollintoview'], function(viz, blower, $) {
	var transitionHighlights = {
		collect : "collect",
		analyze : "analyze",
		clean : "analyze",
		display : "display"
	};
	
	var canvas = document.getElementById("mainCanvas");
	var scale = 1.0;
	
	$(function() {
		viz.animate({
			states : ['init', 'collect', 'analyze', 'clean', 'display', 'medallia'],
			repeat: false,
			initCallback: function(goToState) {
				$('.fixedscroller-outer').fixedScroller();
				$('.viz-control').bind('click', function(){
					var id = $(this).attr('id').split('-')[0];
					goToState(id);
				});
			},
			transitionOutCallback: function(oldStateId) {
				if (oldStateId in transitionHighlights) {
					// Fade out the last explanation, and unhighlight the appropriate control
					$('#' + oldStateId + '-explanation').fadeOut(100);
					$('#' + transitionHighlights[oldStateId] + '-control').removeClass("viz-control-active");
				}
			},
			transitionInCallback: function(newStateId) {
				if (newStateId in transitionHighlights) {
					// Fade in the new explanation, and highlight the appropriate control
					$('#' + newStateId + '-explanation').animate('opacity',150).fadeIn(500);
					$('#' + transitionHighlights[newStateId] + '-control').addClass("viz-control-active");
				}
			},
			messageCallback: function(str) {
				document.getElementById("viz").innerHTML = str;
			},
			blower: blower.getDefaultBlower(canvas, scale),
			canvas: canvas,
		});
	});
});