define(['jquery'], function($) {
	$.fn.fixedScroller = function(settings) {

		var defaultSettings = {
			fixTop: true,
			enabled: true
		};

		settings = $.extend(true, {}, defaultSettings, settings);

		var classes = {
			outer: 'fixedscroller-outer',
			inner: 'fixedscroller-inner',
			limit: 'fixedscroller-limit',
			innerFixed : 'fixedscroller-inner-fixed',
			bottomSuffix: '-bottom',
			topSuffix: '-top'
		};

		return this.each(function() {
			var outer = $(this),
				inner = outer.find(byClass(classes.inner));

			//nothing to do if there's no component to fix
			if (inner.size() !== 1) {
				return;
			}

			//ignore calls to fixedScroller() if the plugin is already enabled
			if (settings.enabled && outer.data('fixedScroller-adjustPosition')) {
				return;
			}

			var limit = outer.find(byClass(classes.limit)),
				isFixedState = false,
				fixedClass = classes.innerFixed + (settings.fixTop ? classes.topSuffix : classes.bottomSuffix);

			//disable plugin
			if (!settings.enabled) {
				var windowHandler = outer.data('fixedScroller-adjustPosition');
				if (windowHandler) {	//if plugin is enabled, then proceed with disabling it
					isFixedState = false;
					unFix(inner, fixedClass, settings.fixTop);   //remove styles
					$(window).unbind('scroll resize', windowHandler);
					outer.data('fixedScroller-adjustPosition', null);	//remove stored data (removeData doesn't work)
				}
				return;
			}

			//define event listener
			var adjustPosition = function() {
				var offset,
					viewport,
					outOfView,
					reachedLimit = false;

				if(settings.fixTop) {
					offset = outer.offset().top;
					viewport = $(window).scrollTop();
					outOfView = viewport >= offset;
					if(limit.size() > 0) reachedLimit = viewport >= limit.offset().top;
				}
				else {
					offset = outer.offset().top + outer.height() - $(window).scrollTop();
					viewport = $(window).height();
					outOfView = viewport < offset;
					if(limit.size() > 0) reachedLimit = viewport < limit.offset().top - $(window).scrollTop() + limit.height() + inner.outerHeight();
				}

				if (isFixedState) {
					if (!outOfView || reachedLimit) {
						isFixedState = false;
						unFix(inner, fixedClass, settings.fixTop);
					}
				}
				else {
					if (outOfView && !reachedLimit) {
						isFixedState = true;
						inner.addClass(fixedClass);
					}
				}

				//hack for IE: use absolute position, and update 'top'/'bottom' on each call
				if(!settings.fixTop && isFixedState && isIE()) {
					var newPosition = viewport + $(window).scrollTop() - inner.height() - outer.offset().top - 26;
					inner.css({
						position: 'absolute',
						top: settings.fixTop ? 'auto' : newPosition + "px",
						bottom: settings.fixTop ? newPosition + "px" : 'auto'
					});
				}
			};

			//store event listener in the component, so that we only have one instance
			outer.data('fixedScroller-adjustPosition', adjustPosition);
			$(window).bind('scroll resize', adjustPosition);

			//initialize (calculate if with current window size / scroll position component must be fixed)
			adjustPosition();
		});

		//helper functions
		function isIE() {
			return $('html').hasClass('ie7') || $('html').hasClass('ie8');
		}

		function unFix(inner, fixedClass, fixTop) {
			inner.removeClass(fixedClass);

			if (!settings.fixTop && isIE()) {
				inner.css({
					top: fixTop ? 0 : 'auto',
					left:'auto',
					bottom: fixTop ? 'auto' : 0
				});
			}
		}

		function byClass(className) {
			return '.' + className;
		}
	};
});