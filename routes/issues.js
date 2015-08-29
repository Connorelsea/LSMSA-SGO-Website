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

		var separator = "|-|"

		/*
		 * FILTER: Top
		 *
		 * Sorts the post by number of votes in descending order
		 * from the top of the page.
		 */
		if (req.query.filter == "top") {

			connection.query(

				/*
				 * Return list of posts with numbers of upvotes.
				 * Posts that have no upvotes have a NULL value
				 * in the likeCount column.
				 */

				"SELECT E.id, E.time, E.title, E.body, E.type,\n" +
				"GROUP_CONCAT(C.body SEPARATOR '" + separator + "') AS comments,\n" + 
				"sum(if(L.elementID is null,0,1)) as likeCount\n" +
				"FROM elements E\n" +
				"LEFT JOIN comments C on E.id=C.elementID\n" +
				"LEFT JOIN likes L on E.id=L.elementID\n" +
				"group by E.id\n",

				function(err, rows) {

					if (err) {
						res.send("ERROR " + err)
					}

					/*
					 * Create issue objects to send to the page
					 * being rendered
					 */

					var issues = [];

					// Loop throug every issue that was
					// returned by the SQL query.
					for (var i = 0; i < rows.length; i++) {

						// Push the initial issues object to
						// the  issues  array  with an empty
						// comments array.
						issues.push({
							title    : rows[i].title,
							time     : rows[i].time,
							body     : rows[i].body,
							likes    : rows[i].likeCount,
							comments : []
						});

						// Split concatenated string of comments,
						// making an array of all comments
						var comments = rows[i].comments.split(separator);

						// Fill the empty comments array in the
						// issues  object  with  its respective
						// comments.
						for (var c = 0; c < comments.length; c++) {

							issues[i].comments.push({
								body : comments[c]
							});

						}
					}

					/*
					 * Render the issues page and send  it the 
					 * array of issues and their data/comments
					 * to use when displaying them on the page.
					 */
					res.render("issues.jade", {
						mainNavigation : data.mainNavigation,
						user           : req.user,
						rows           : rows,
						filter         : "top"
					});

				}
			);

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