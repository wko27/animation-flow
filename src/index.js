var viz = require('./js/viz');
var blower = require('./js/util/blower');
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
		image : "images/sthacktrix.jpg",
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
		scale: scale
	});
}); // dom ready
