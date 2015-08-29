var data = require("../info/index")

module.exports = function(app, passport, connection) {

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

		/*
		 * FILTER: Top
		 *
		 * Sorts the post by number of votes in descending order
		 * from the top of the page.
		 */
		if (req.query.filter == "top") {

			var element_rows;
			var comment_rows;

			connection.query(

				/*
				 * Return list of posts with numbers of upvotes.
				 * Posts that have no upvotes have a NULL value
				 * in the likeCount column.
				 */
				"SELECT E.id, E.googleID, E.title, L.likeCount\n" +
    			"FROM elements E\n"             +

    			"LEFT JOIN (\n"                 +
        		"	SELECT elementId\n"         +
            	"	, COUNT(id) AS likeCount\n" +
            	"	FROM likes\n"               +
            	"	GROUP BY elementId\n"       +
    			") L ON L.elementId = E.id\n",

				function(err, rows) {

					for (var i = 0; i < rows.length; i++) {
						if (rows[i].likeCount == null)
							rows[i].likeCount = 0;
					}

					if (err) {
						res.send("ERROR " + err)
					}
					else {
						element_rows = rows;
					}

				}
			);

			res.render("issues.jade", {
				mainNavigation : data.mainNavigation,
				user           : req.user,
				rows           : element_rows,
				filter         : "top"
			});

		}

		/*
		 * FILTER: Recent
		 *
		 * Sorts the most recent posts by dates in descending order
		 * from the top of the page.
		 */
		else if (req.query.filter == "recent") {

		}

		/*
		 * FILTER: Recent-Top
		 *
		 * If the filter is not specified, or if the filter is set
		 * to Recent-Top. Recent-Top shows the top posts in recent
		 * history, as well as the most recent posts.
		 */
		else {

		}

	});

}