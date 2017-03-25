"use strict";
module.exports = {
	getWebGL: function(canvas) {
		var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");;
		if (!gl) {
			throw new Error("Could not obtain WebGL context from canvas");
		}
		return gl;
	},
	getShader : function(gl, type, text) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, text);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
			throw new Error("Could not compile shader: " + gl.getShaderInfoLog(shader));
		}
		return shader;
	},
	getProgram : function(gl, vertexShaderText, fragmentShaderText) {
		var shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, this.getShader(gl, gl.VERTEX_SHADER, vertexShaderText));
		gl.attachShader(shaderProgram, this.getShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText));
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost()) {
			throw new Error("Could not create program: " + gl.getProgramInfoLog(program));
		}

		return shaderProgram;
	}
};
