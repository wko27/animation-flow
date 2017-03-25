module.exports = "// Constant (width, height) of the canvas\n" +
	
	"    uniform vec2 u_resolution;\n" +

	"	// (x, y) coordinate position of the pixel\n" +
	"	attribute vec2 a_position;\n" +

	"	// (r, g, b, a) color of the pixel\n" +
	"	attribute vec4 a_color;\n" +
	"	varying vec4 v_color;\n" +

	"	// Size of the pixel\n" +
	"	attribute float a_size;\n" +

	"	void main() {\n" +
	"	// convert the rectangle from pixels to 0.0 to 1.0\n" +
	"	vec2 zeroToOne = a_position / u_resolution;\n" +

	"	// convert from 0->1 to 0->2\n" +
	"	vec2 zeroToTwo = zeroToOne * 2.0;\n" +

	"	// convert from 0->2 to -1->+1 (clipspace)\n" +
	"	vec2 clipSpace = zeroToTwo - 1.0;\n" +

	"   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);\n" +

	"   gl_PointSize = a_size;\n" +

	"	v_color = a_color;\n" +
	"}";