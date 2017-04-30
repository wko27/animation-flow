define(['jquery'], function($) {
	//These could be refactored into jQuery plugins
	var engPanel = $('#meetTheEngineers');
	engPanel.on('click', '.gallery-photo', function(){
		var nextSlider = $(this).next('.gallery-slider');
		if (nextSlider.is('.gallery-slider-expanded')) return;

		engPanel.find('.gallery-slider-expanded').stop(true, true).animate({
			width: '0'
		}, 300).removeClass('gallery-slider-expanded')
			.find('.gallery-text').fadeOut();

		nextSlider.stop(true, true).animate({
			width: '365px'
		}, 300).addClass('gallery-slider-expanded')
			.find('.gallery-text').fadeIn();
	});
	
	var projPanel = $('#meetTheProjects');
	projPanel.find('.accordion-content').hide();
	
	var defaultContent = $("#"+projPanel.find('.accordion-key-default').addClass("accordion-key-active").attr('data-content-id'));
	defaultContent.addClass("accordion-content-active").show();
	
	projPanel.find('.accordion-keys').on('click', '.accordion-key:not(.accordion-key-active)', function() {
		var contentId = "#" + $(this).attr('data-content-id');
		console.info("Showing content with content-id = " + contentId );
		projPanel.find(".accordion-key-active").removeClass("accordion-key-active");
		$(this).addClass("accordion-key-active");
		projPanel.find(".accordion-content-active")
			.removeClass("accordion-content-active")
			.hide()
		.end()
		.find(contentId)
			.addClass("accordion-content-active")
			.fadeIn()
		.end();
	})
});
