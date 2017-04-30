var viz = require('./js/viz');
var blower = require('./js/util/blower');
var $ = require('jquery');

$(function() {
    var canvas = document.getElementById("mainCanvas");
    var scale = 1.0;
      
    viz.animate({
	states : ['message'],
	repeat : true,
	image : null,
	// TODO: Read message in from a file/IM/email
	message : "Insert message here",
	states : ['message'],
	//				renderer : getWebGLRenderer(canvas, scale),
	//				renderer : _.extend(getCanvasRenderer(canvas, scale), { numMovers : 5000 }),
	blowEnabled : true,
	canvas : canvas
    });
});
