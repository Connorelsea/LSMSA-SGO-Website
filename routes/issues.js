var data = require("../info/index")

module.exports = function(app, passport) {

	/*
	 * GET: Submit an issue
	 */
	app.get("/issues/submit", function(req, res) {
		res.render("submit.jade", {
			mainNavigation : data.mainNavigation,
			user           : req.user
		});
	});

	/*
	 * POST: Submit an issue form information
	 */
	app.post("/issues/submit", function(req, res) {

	});

	/*
	 * GET: Specific Issues
	 *
	 * View a singular issue on a page, showing its comments,
	 * responses, and other more detailed information. It is
	 * parameterized by issue ID.
	 */
	app.get("/issues/:issue_id", function(req, res) {

		res.send("ID: " + req.params.issue_id);
	});

	/*
	 * GET: Issue Page
	 * 
	 * Show a list of all issues, sorted or filtered in a manner
	 * determined by URL parameters.
	 */
	app.get("/issues", function(req, res) {

		res.send("ISSUES")

	});

}