var data = require("../info/index")

function createIssues(rows, wrap) {
	var issues = [];

	// Loop throug every issue that was
	// returned by the SQL query.
	for (var i = 0; i < rows.length; i++) {

		var new_body  = rows[i].body;
		var new_title = rows[i].title;


		if (wrap == true) {

			if (new_body.length > 50) {
				new_body = new_body.substring(0, 50) + "...";
			}

			if (new_title.length > 50) {
				new_title = new_title.substring(0, 50) + "...";
			}

		}

		// Push the initial issues object to
		// the  issues  array  with an empty
		// comments array.
		issues.push({
			id       : rows[i].id,
			title    : new_title,
			date     : rows[i].time,
			body     : new_body,
			likes    : ((rows[i].likeCount == null) ? 0 : rows[i].likeCount),
			comments : []
		});

		// Split concatenated string of comments,
		// making an array of all comments
		var comments = [];

		if (rows[i].comments) {
			comments = rows[i].comments.split("|-|");
		}

		// Fill the empty comments array in the
		// issues  object  with  its respective
		// comments.
		for (var c = 0; c < comments.length; c++) {
			issues[i].comments.push({
				body : comments[c]
			});
		}
	}

	return issues;
}

module.exports = function(app, passport, connection) {

	var queryIssues = function(orderBy, callback) {

		connection.query(
			/*
			 * Return list of posts with numbers of upvotes.
			 * Posts that have no upvotes have a NULL value
			 * in the likeCount column.
			 */
			"SELECT E.id, E.time, E.title, E.body, E.type, C.comments, E.googleID, L.likeCount\n" + 
			"FROM elements E\n" + 
			"LEFT JOIN(\n" + 
			"    SELECT elementID, GROUP_CONCAT(body SEPARATOR '|-|') AS comments\n" + 
			"    FROM comments\n" + 
			"    GROUP BY elementID\n" + 
			") C on C.elementID = E.id\n" + 
			"LEFT JOIN (\n" + 
			"    SELECT elementID, COUNT(id) AS likeCount\n" + 
			"    FROM likes\n" + 
			"    GROUP BY elementID\n" + 
			") L ON L.elementID = E.id\n" + orderBy, callback
		);

		return 0;
	}

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

		var issue = {
			googleID : req.user.googleID,
			title    : req.body.title,
			body     : req.body.description,
			type     : "issue"
		}

		connection.query(
			"INSERT INTO elements SET ?", issue,
			function(rows, err) {
				if (err)
					console.log(err)
			}
		)

		res.redirect("/issues?filter=top");
	});

	/*
	 * GET: Specific Issues
	 *
	 * View a singular issue on a page, showing its comments,
	 * responses, and other more detailed information. It is
	 * parameterized by issue ID.
	 */
	app.get("/issues/:issue_id", function(req, res) {

		console.log("START")

		/*
		 * Do a like action on this issue.
		 * URL: /issues/:issue_id?action=like
		 */
		if (req.query.action == "like") {

			console.log("LIKE")

			if (req.user) {

				var like = {
					elementID : req.params.issue_id,
					googleID  : req.user.googleID
				}

				connection.query(
					"INSERT INTO likes SET ?", like,
					function(rows, err) {
						if (err)
							console.log(err)
					}
				);

			}

			res.redirect("/issues");
			return;
		}

		/*
		 * Load the page for the specific issue.
		 */

		connection.query(

			"SELECT E.id, E.time, E.title, E.body, E.type, C.comments, E.googleID, L.likeCount\n" +
			"FROM elements E\n" +
			"LEFT JOIN(\n" +
			"  SELECT elementID, GROUP_CONCAT(body SEPARATOR '|-|') AS comments\n" +
			"  FROM comments\n" +
			"  GROUP BY elementID\n" +
			") C on C.elementID = E.id\n" +
			"LEFT JOIN (\n" +
			"  SELECT elementID, COUNT(id) AS likeCount\n" +
			"  FROM likes\n" +
			"  GROUP BY elementID\n" +
			") L ON L.elementID = E.id\n" +
			"WHERE E.id = " + req.params.issue_id,

			function(err, rows) {

				if (err) {
					console.log(err);
					res.redirect("/issues");
				}

				var issues = createIssues(rows, false);

				res.render(
					"issue-page.jade",
					{
						mainNavigation : data.mainNavigation,
						user           : req.user,
						issue          : issues[0]
					}
				);
			}

		);

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
		if (req.query.filter == "top" || !req.query.filter) {

			queryIssues(
				"ORDER BY L.likeCount DESC",
				function(err, rows) {

					if (err) {
						res.send("ERROR " + err)
					}

					/*
					 * Create issue objects to send to the page
					 * being rendered
					 */
					 var issues = createIssues(rows, true)

					/*
					 * Render the issues page and send  it the 
					 * array of issues and their data/comments
					 * to use when displaying them on the page.
					 */
					res.render(
						"issues.jade",
						{
							mainNavigation : data.mainNavigation,
							user           : req.user,
							rows           : issues,
							filter         : "top"
						}
					);	

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

			queryIssues(
				"ORDER BY E.time DESC",
				function(err, rows) {

					if (err) {
						res.send("ERROR " + err)
					}

					/*
					 * Create issue objects to send to the page
					 * being rendered
					 */
					 var issues = createIssues(rows, true)

					/*
					 * Render the issues page and send  it the 
					 * array of issues and their data/comments
					 * to use when displaying them on the page.
					 */
					res.render(
						"issues.jade",
						{
							mainNavigation : data.mainNavigation,
							user           : req.user,
							rows           : issues,
							filter         : "top"
						}
					);

				}
			);

		}

		/*
		 * FILTER: Recent-Top
		 *
		 * If the filter is not specified, or if the filter is set
		 * to Recent-Top. Recent-Top shows the top posts in recent
		 * history, as well as the most recent posts.
		 */
		else {
			// Temporary redirect
			res.redirect("/issues")
		}

	});

}