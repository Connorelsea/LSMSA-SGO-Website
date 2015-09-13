var data = require("../info/index")

module.exports = function(app, passport) {

	app.get("/about", function(req, res) {

		res.render("about.jade", {
			mainNavigation : data.mainNavigation,
			user           : req.user
		});

	})

	app.get("/members", function(req, res) {

		res.render("coming-soon.jade", {
			mainNavigation : data.mainNavigation,
			user           : req.user
		});

	})

	app.get("/constitution", function(req, res) {

		res.render("coming-soon.jade", {
			mainNavigation : data.mainNavigation,
			user           : req.user
		});

	})

	app.get("/events", function(req, res) {

		res.render("events.jade", {
			mainNavigation : data.mainNavigation,
			user           : req.user
		});

	})

	app.get("/news", function(req, res) {

		res.render("news.jade", {
			mainNavigation : data.mainNavigation,
			user           : req.user
		});

	})

}