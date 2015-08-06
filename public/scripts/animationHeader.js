$(window).scroll(function() {

	// If the user has scrolled down, change the
	// main bar's class, making it smaller.

	if ($(document).scrollTop() > 10) {

		$(".barMain").addClass("barMainSmall");
		$("header .image img").addClass("imageSmall");

	} else {

		$(".barMain").removeClass("barMainSmall");
		$("header .image img").removeClass("imageSmall");

	}

});