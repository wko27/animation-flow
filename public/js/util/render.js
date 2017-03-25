
/**
 * Handles creating a WebGL or HTML5 Canvas renderer for the movers
 */

var webgl_utils = require('./webgl'),
	fragmentShaderSource = require('../shaders/pixel.fs.js'),
	vertexShaderSource = require('../shaders/pixel.vs.js');


/** @return Renderer which uses WebGL */
function getWebGLRenderer(canvas) {
	var numMovers = 5000;
	var v = {};

	var disabled = false;
	canvas.addEventListener(
		"webglcontextlost",
		function(event) {
			event.preventDefault();
			disabled = true;
		},
		false
	);

	canvas.addEventListener(
        "webglcontextrestored",
        init,
        false
    );

	function init() {
		var gl;
		try {
			gl = webgl_utils.getWebGL(canvas);
		} catch (e) {
			throw e;
		}

		// Enable blending to imitate canvas composite operation 'lighter'
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);

		var program;
		try {
			program = webgl_utils.getProgram(gl, vertexShaderSource, fragmentShaderSource);
		} catch (e) {
			throw e;
		}

		gl.useProgram(program);

		// Set the resolution
		var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
		gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

		// Create a buffer for the position attribute
		var positionLocation = gl.getAttribLocation(program, "a_position");
		gl.enableVertexAttribArray(positionLocation);

		// Create a buffer for the size attribute
		var sizeLocation = gl.getAttribLocation(program, "a_size");
		gl.enableVertexAttribArray(sizeLocation);

		// Create a buffer for the color attribute
		var colorLocation = gl.getAttribLocation(program, "a_color");
		gl.enableVertexAttribArray(colorLocation);

		// One buffer to rule them all ...
		var buffer = gl.createBuffer();

		var vertexSizeInBytes = 3 * Float32Array.BYTES_PER_ELEMENT + 4 * Uint8Array.BYTES_PER_ELEMENT;
		var vertexSizeInFloats = vertexSizeInBytes / Float32Array.BYTES_PER_ELEMENT;

		// Store in 1 buffer the 2 floats for position, then 1 float for size, then 4 floats for color
		var arr = new ArrayBuffer(numMovers * vertexSizeInBytes);
		var floatArr = new Float32Array(arr);
		var uintArr = new Uint8Array(arr);

		// Save all of the state
		v.gl = gl;
		v.canvas = canvas;

		v.resolutionLocation = resolutionLocation;
		v.positionLocation = positionLocation;
		v.sizeLocation = sizeLocation;
		v.colorLocation = colorLocation;

		v.buffer = buffer;
		v.vertexSizeInBytes = vertexSizeInBytes;
		v.vertexSizeInFloats = vertexSizeInFloats;

		v.arr = arr;
		v.floatArr = floatArr;
		v.uintArr = uintArr;

		disabled = false;
	};

	init();

	return {
		numMovers : numMovers,
		render : function(movers) {
			if (disabled)
				return;

			var floatIdx = 0;
			var uintIdx = 3 * Float32Array.BYTES_PER_ELEMENT;

			// Extract position, size, and color for each mover
			var i = this.numMovers;
			while ( i-- ) {
				var m  = movers[i];
				v.floatArr[floatIdx + 0] = m.x;
				v.floatArr[floatIdx + 1] = m.y;

				v.floatArr[floatIdx + 2] = m.size;

				v.uintArr[uintIdx + 0] = m.color[0];
				v.uintArr[uintIdx + 1] = m.color[1];
				v.uintArr[uintIdx + 2] = m.color[2];
				v.uintArr[uintIdx + 3] = m.hide ? 0 : 255;

				floatIdx += v.vertexSizeInFloats;
				uintIdx += v.vertexSizeInBytes;
			}

			var gl = v.gl;
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			// ... and in the darkness bind them
			gl.bindBuffer(gl.ARRAY_BUFFER, v.buffer);
			gl.vertexAttribPointer(v.positionLocation, 2, gl.FLOAT, false, v.vertexSizeInBytes, 0);
			gl.vertexAttribPointer(v.sizeLocation, 1, gl.FLOAT, false, v.vertexSizeInBytes, 8);
			gl.vertexAttribPointer(v.colorLocation, 4, gl.UNSIGNED_BYTE, true, v.vertexSizeInBytes, 12);
			gl.bufferData(gl.ARRAY_BUFFER, v.arr, gl.DYNAMIC_DRAW);

			gl.drawArrays(gl.POINTS, 0, this.numMovers);
		}
	};
}

/**
 * @return a Renderer which uses HTML5 canvas
 */
function getCanvasRenderer(canvas) {
	var ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Please use a modern browser which supports HTML5 canvas");
	}

	return {
		numMovers : 2000,
		render : function(movers) {
			ctx.globalCompositeOperation = "source-over";
			ctx.clearRect ( 0 , 0 , canvas.width , canvas.height );

			ctx.globalCompositeOperation = "lighter";
			var i = this.numMovers;
			while ( i-- ) {
				var m  = movers[i];
				if (!m.hide) {
					ctx.fillStyle = "rgb(" + m.color.join() + ")";
					ctx.fillRect(m.x - m.size / 2, m.y + m.size / 2, m.size, m.size);
				}
			}
		}
	};
}

module.exports =  {
	getRenderer: function(renderer, canvas) {
		if (!renderer || renderer === "webgl") {
			try {
				return getWebGLRenderer(canvas);
			} catch (e) {
				console.log("Failed to obtain webgl renderer " + e);
			}
		}

		if (!renderer || renderer === "canvas") {
			try {
				return getCanvasRenderer(canvas);
			} catch (e) {
				console.log("Failed to obtain canvas renderer" + e);
			}
		}

		if (!renderer) {
			throw new Error("Unable to render, neither webgl nor canvas are supported");
		} else {
			throw new Error("Unknown rendering option " + config.renderer + ", please specify 'webgl' or 'canvas'");
		}
	}
};
