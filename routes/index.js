var data = require("../info/index")

module.exports = function(app, passport) {

	/*
	 * GET: Home page
	 */
	app.get("/", function(req, res) {

		res.render("index.jade", {
			mainNavigation : data.mainNavigation,
			user           : req.user
		});

	});
	
}