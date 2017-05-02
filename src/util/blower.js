/**
 * Blower to handle blowback via mouseclicks
 */
module.exports =  {
	getDefaultBlower: function(canvasDiv, scale) {
		var blower = {
			blowing : false,
			blowX : null,
			blowY : null,
		};

		// Register mouse handlers
		document.onmousedown = function(e) {
			blower.blowing = true;
			blower.blowX = (e.pageX - canvasDiv.offsetLeft) / scale;
			blower.blowY = (e.pageY - canvasDiv.offsetTop) / scale;
		};

		document.onmouseup = function(e) {
			blower.blowing = false;
		};

		document.onmousemove = function(e) {
			if (blower.blowing) {
				blower.blowX = (e.pageX - canvasDiv.offsetLeft) / scale;
				blower.blowY = (e.pageY - canvasDiv.offsetTop) / scale;
			}
		};

		return blower;
	}
};
