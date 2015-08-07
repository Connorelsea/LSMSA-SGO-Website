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
	var newWidth = width + 400

	$(".primaryCover").css({ "width" : newWidth })
	$(".secondaryCover").css({ "width" : newWidth })
	$(".tertiaryCover").css({ "width" : newWidth })

}

$(window).resize(widthCorrection);
$(document).ready(widthCorrection);

var topWidthNormal = 180;
var topWidthSmall  = 80;

$(window).scroll(function() {

	// If the user has scrolled down, change the
	// main bar's class, making it smaller.

	var scroll = $(document).scrollTop();

	if (scroll > 0) {

		for (i = 0; i < classes.length; ++i) {
			$(classes[i].parent).addClass(classes[i].addon)
		}

	} else {

		for (i = 0; i < classes.length; ++i) {
			$(classes[i].parent).removeClass(classes[i].addon)
		}

	}

	// Apply parallax effects for the covers

	var primaryScroll = scroll / 50;
	var primaryRotate = -4 + (scroll / 100);

	$(".primaryCover").css({
		"transform" : "translate(0px, -" + primaryScroll + "%) rotate(" + primaryRotate + "deg)"
	})
	
	var secondaryScroll = scroll / 10;
	var secondaryRotate = -1 + (scroll / -100)

	$(".secondaryCover").css({
		"transform" : "translate(0px, -" + secondaryScroll + "%) rotate(" + secondaryRotate + "deg)"
	})

	var foregroundScroll = topWidthNormal - (scroll / 5)

	$(".foreground").css({
		"top" : foregroundScroll
	})

	var tertiaryScroll = scroll / 200;
	var tertiaryRotate = -1.5 + (scroll / -200)

	$(".tertiaryCover").css({
		"transform" : "translate(0px, -" + tertiaryScroll + "%) rotate(" + tertiaryRotate + "deg)"
	})

	var actionScale = 1 - (scroll / 100)

	$(".innerBar .action").css({
		"transform" : "scale(" + actionScale + "%)"
	})

});