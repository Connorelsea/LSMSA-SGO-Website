var data = require("../info/index")

module.exports = function(app, passport) {

	app.get("/", function(req, res) {

		res.render("index.jade", {
			mainNavigation : data.mainNavigation,
			user           : req.user
		})

	})
	
}