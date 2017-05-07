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

	const transitionHighlights = {
		collect : "collect",
		analyze : "analyze",
		clean : "analyze",
		display : "display"
	};
	
	function onImageLoad() {
		animation.start();
	}
	
	const animation = viz.animate({
		states: [
			viz.states.scatter(),
			viz.states.nestedDiamonds(),
			viz.states.circles(),
			viz.states.circlesFigureEight(),
			viz.states.display(),
			viz.states.staticText("MEDALLIA"),
			viz.states.image("images/sthacktrix.jpg")
		],
		repeat: true,
		initCallback: function(goToState) {
			// Register visualization controls
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
		blowEnabled: true,
		canvas: canvas
	});
	animation.start();
  }); // dom ready
}

function message(domElement, width, height, messageText) {
  $(function() {
    const canvas = document.createElement("canvas");
    domElement.appendChild(canvas);
    canvas.width = width;
    canvas.height = height;
    
    animation = viz.animate({
      states : [viz.states.scrollingText(messageText)],
      repeat : true,
      blowEnabled : true,
      canvas : canvas
    });
    
    animation.start();
  });
}

module.exports = {
  medallia: medallia,
  message: message
};
