var classes = [
	{
		parent : ".barMain",
		addon  : "barMainSmall"
	},
	{
		parent : "header .image .img",
		addon  : "imageSmall"
	}
]

var widthCorrection = function() {

	var width    = $(window).width()
	var newWidth = width + 200

	$(".primaryCover").css({ "width" : newWidth })
	$(".secondaryCover").css({ "width" : newWidth })

}

$(window).resize(widthCorrection);
$(document).ready(widthCorrection);

$(window).scroll(function() {

	// If the user has scrolled down, change the
	// main bar's class, making it smaller.

	if ($(document).scrollTop() > 0) {

		for (i = 0; i < classes.length; ++i) {
			$(classes[i].parent).addClass(classes[i].addon)
		}

	} else {

		for (i = 0; i < classes.length; ++i) {
			$(classes[i].parent).removeClass(classes[i].addon)
		}

	}

});