const colors = require("./colors");

const movers = [];

function Mover() {
	this.count = Mover.count ++;
	this.type1 = this.count % Mover.numType1Types;
	this.type2 = this.count % Mover.numType2Types;

	// 36 color types
	this.colorType = this.count % colors.numColors;

	// 4 group types
	this.groupType = this.colorType % 4;

	// 9 inner group types
	this.innerGroupType = Math.floor(this.colorType / 4);

	// RGB values as an array with values in [0, 255]
	this.color = colors.colors[this.colorType];
	
	// Function to reset the original color
	this.resetColor = function() {
		this.color = colors.colors[this.colorType];
	};
	
	this.hide = false;
	this.fixed = false;
	
	this.x	 = 0;
	this.y	 = 0;
	this.vX	= 0;
	this.vY	= 0;
	this.size  = 1;
	this.targetX = 0;
	this.targetY = 0;
}

Mover.count = 0;
Mover.numType1Types = 4;
Mover.numType2Types = 7;

/** Resets the colors of all movers */
function resetColors() {
	var i = movers.length;
	while (i-- > 0) {
		var m = movers[i];
		m.resetColor();
		m.hide = false;
		m.fixed = false;
	}
}

/** Updates the position of each mover */
function updatePosition(animationState, blower) {
	var toDist = animationState.canvasW * 0.86;
	
	var Mrnd = Math.random;
	var Mabs = Math.abs;

	var i = movers.length;
	
	var blower = blower;
	var blowing = blower && blower.blowing;
	var blowX = blower && blower.blowX;
	var blowY = blower && blower.blowY;
	var blowDist = animationState.canvasW;
	
	while ( i-- ){
		var m  = movers[i];
		
		var x  = m.x;
		var y  = m.y;
		var vX = m.vX;
		var vY = m.vY;
		
		var dX = x - m.targetX;
		var dY = y - m.targetY;
		var d  = Math.sqrt( dX * dX + dY * dY ) || 0.001;
		dX /= d;
		dY /= d;
		
		if (!m.fixed && blowing) {
			blowDx = x - blowX;
			blowDy = y - blowY;
			var blowD = blowDx * blowDx + blowDy * blowDy;
			if ( blowD < blowDist ){
				var blowAcc = ( 1 - ( d / blowDist ) ) * 14;
				vX += dX * blowAcc + 0.5 - Mrnd();
				vY += dY * blowAcc + 0.5 - Mrnd();
			}
		}

		if ( d < toDist ){
			var toAcc = ( 1 - ( d / toDist ) ) * 1.12;
			vX -= dX * toAcc;
			vY -= dY * toAcc;
		}
		
		vX *= animationState.friction;
		vY *= animationState.friction;

		// Size of the pixel to display
		// TODO: Make this variable ...
		// Specifically, we need to scale the input (0, +inf) to (min, max) as provided by the config
		var size = ( Mabs( vX ) + Mabs( vY ) ) * 1.5; // 1.5 is the speedSizeRatio
		
		// Scale to between [2, 3]
		if ( size > 3 ) {
			size = 3;
		} else if ( size < 2 ) {
			size = 2;
		}
		
		var nextX = x + vX;
		var nextY = y + vY;

		if (nextX > animationState.canvasW) {
			nextX = animationState.canvasW;
			vX *= -1;
		} else if (nextX < 0) {
			nextX = 0;
			vX *= -1;
		}

		if (nextY > animationState.canvasH) {
			nextY = animationState.canvasH;
			vY *= -1;
		} else if (nextY < 0) {
			nextY = 0;
			vY *= -1;
		}

		m.vX = vX;
		m.vY = vY;
		m.x  = nextX;
		m.y  = nextY;
		m.size = size;

		if (m.hide) {
			continue;
		}
		
		if (m.fixed) {
			m.x = m.targetX;
			m.y = m.targetY;
		}
	}
}

/** Set the initial positions and colors of the movers */
function initialize(animationState, numMovers) {
	for (var i = 0; i < numMovers; i ++) {
		var m = new Mover();
		m.x = animationState.canvasW * 0.5;
		m.y = animationState.canvasH * 0.5;
		m.vX = Math.cos(i) * Math.random() * 34;
		m.vY = Math.cos(i) * Math.random() * 34;
		m.targetX = Math.random() * animationState.canvasW;
		m.targetY = Math.random() * animationState.canvasH;
		movers[i] = m;
	}
}

module.exports = {
	movers: movers,
	initialize: initialize,
	resetColors: resetColors,
	updatePosition: updatePosition,
}