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

require(['viz'], function(viz, blower) {
	$(function() {
		var canvas = document.getElementById("mainCanvas");
		var scale = 1.0;
	
		viz.animate({
			states : ['message'],
			repeat : true,
			image : null,
			// TODO: Read message in from a file/IM/email
			message : "This is a public service announcement from the Engineering team at Medallia.  We have improved the animation!  Thank you, Medallia Engineering",
			states : ['message'],
	//				renderer : getWebGLRenderer(canvas, scale),
	//				renderer : _.extend(getCanvasRenderer(canvas, scale), { numMovers : 5000 }),
			blowEnabled : true,
			canvas : canvas,
		});
	});
});