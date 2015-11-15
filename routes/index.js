var data = require("../info/index")

module.exports = function(app, passport) {

	app.get("/changelog", function(req, res) {

		res.render("changelog.jade", {
			mainNavigation : data.mainNavigation,
			mobileNav       : data.mobileNavigation,
			user           : req.user,
			title          : "LSMSA SGO - Changelog"
		});

	})

	app.get("/about", function(req, res) {

		res.render("about.jade", {
			mainNavigation : data.mainNavigation,
			mobileNav       : data.mobileNavigation,
			user           : req.user,
			title          : "LSMSA SGO - About"
		});

	})

	app.get("/members", function(req, res) {

		res.render("coming-soon.jade", {
			mainNavigation : data.mainNavigation,
			mobileNav       : data.mobileNavigation,
			user           : req.user,
			title          : "LSMSA SGO - Members"
		});

	})

	app.get("/constitution", function(req, res) {

		res.render("constitution.jade", {
			mainNavigation : data.mainNavigation,
			mobileNav       : data.mobileNavigation,
			user           : req.user,
			title          : "LSMSA SGO - Constitution"
		});

	})

	app.get("/events", function(req, res) {

		res.render("events.jade", {
			mainNavigation : data.mainNavigation,
			mobileNav       : data.mobileNavigation,
			user           : req.user,
			title          : "LSMSA SGO - Events"
		});

	})

	app.get("/news", function(req, res) {

		res.render("news.jade", {
			mainNavigation : data.mainNavigation,
			mobileNav       : data.mobileNavigation,
			user           : req.user,
			title          : "LSMSA SGO - News"
		});

	})

	app.get("/technology", function(req, res) {

		res.render("technology.jade", {
			mainNavigation : data.mainNavigation,
			mobileNav       : data.mobileNavigation,
			user           : req.user,
			title          : "LSMSA SGO - Technology",
			techs          : techs
		});

	})

	var techs = [
		{
			tech: "Node.JS",
			desc: "Javascript runtime for the server backend"
		},
		{
			tech: "Express",
			desc: "A Node.JS web framework"
		},
		{
			tech: "Jade",
			desc: "HTML Templating engine"
		},
		{
			tech: "Stylus",
			desc: "CSS pre-processor"
		},
		{
			tech: "MySQL",
			desc: "Relational database"
		},
		{
			tech: "JQuery",
			desc: "Tool for frontend manipulation"
		},
		{
			tech: "Node.JS Libraries",
			desc: "Including Bluebird, NodeMySQL, Async and others"
		}
	]

}