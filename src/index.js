var viz = require('./viz');
var blower = require('./util/blower');
var $ = require('jquery');

function medallia(domElement, width, height) {
  $(function() {
	const canvas = document.createElement("canvas");
	domElement.appendChild(canvas);
	canvas.style.top = 0;
	canvas.style.left = 0;
	canvas.style.position = "absolute";

	canvas.width = width;
	canvas.height = height;

	var transitionHighlights = {
		collect : "collect",
		analyze : "analyze",
		clean : "analyze",
		display : "display"
	};
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
}

function message(domElement, width, height, messageText) {
  $(function() {
    const canvas = document.createElement("canvas");
    domElement.appendChild(canvas);
    canvas.width = width;
    canvas.height = height;
    
    viz.animate({
	states : ['message'],
	repeat : true,
	image : null,
	// TODO: Read message in from a file/IM/email
	message : messageText,
	blowEnabled : true,
	canvas : canvas
    });
  });
}

module.exports = {
  medallia: medallia,
  message: message
};
