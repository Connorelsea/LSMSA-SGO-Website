var data  = require("../info/index")
var async = require("async")
var iutil = require("../utility/issueFunctions.js")

// TODO : There are way too many different places calling basically
//        the same SQL to draw down issues. It needs to be standardized
//        so I don't have to change things in like four different places
//        to get it to work.

module.exports = function(app, passport, connection) {

	var isAdmin = function(req) {
		var email = req.user.email.toLowerCase()
		console.log("Checking if is admin " + email)

		if (email === "elilangley@student.lsmsa.edu"  ||
			email === "connorelsea@student.lsmsa.edu" ||
			email === "sgo@lsmsa.edu") {
			return true
		}
		else {
			return false
		}
	}

	var queryIssues = function(orderBy, callback) {

		connection.query(
			/*
			 * Return list of posts with numbers of upvotes.
			 * Posts that have no upvotes have a NULL value
			 * in the likeCount column.
			 */
			"SELECT E.id, E.time, E.title, E.body, E.type, E.approved, E.views, E.resolved, C.comments, E.googleID, L.likeCount\n" + 
			"FROM elements E\n" + 
			"LEFT JOIN(\n" + 
			"    SELECT elementID, GROUP_CONCAT(CASE WHEN approved = 1 THEN body ELSE NULL END ORDER BY time DESC SEPARATOR '|-|') AS comments\n" + 
			"    FROM comments\n" + 
			"    GROUP BY elementID\n" + 
			") C on C.elementID = E.id\n" + 
			"LEFT JOIN (\n" + 
			"    SELECT elementID, COUNT(id) AS likeCount\n" + 
			"    FROM likes\n" + 
			"    GROUP BY elementID\n" + 
			") L ON L.elementID = E.id\nWHERE E.approved = 1\n" + orderBy, callback
		);

		return 0;
	}

	/*
	 * Performs a "like" action on a certain element/issue
	 * using the information given to this function as arguments.
	 */
	var doLike = function(req, elementID, googleID, callback) {

		console.log("doing like")

		var like = {
			elementID : req.params.issue_id,
			googleID  : req.user.googleID
		}

		connection.query(
			"INSERT INTO likes SET ?", like,
			function(rows, err) {

				if (err)
					console.log(err)

				callback();
			}
		);

	}

	var alertLink = function(issueID, alertTitle, alertBody) {
		return ("/issues/" + issueID + "?alertTitle=" + alertTitle + "&alertBody=" + alertBody);
	}

	/*
	 * GET: Home page
	 *
	 * Renders the home page of the website.
	 */
	app.get("/", function(req, res) {

		queryIssues(
		"ORDER BY L.likeCount DESC LIMIT 3\n",
			function(err, rows) {

				if (err) {
					res.send("ERROR " + err)
				}

				var issues = iutil.createIssues(rows, true)

				var ogurl   = req.protocol + "://" + req.hostname + req.originalUrl;
				var baseurl = req.protocol + "://" + req.hostname;

				res.render("index.jade", {
					mainNavigation : data.mainNavigation,
					user           : req.user,
					rows           : issues,
					title          : "LSMSA SGO - Home",
					keywords       : "lsmsa, student government, lsmsa sgo, sgo, louisiana school",
					description    : "The official LSMSA Student Government Organization (LSMSA SGO) website made for students, by students.",
					linkimage      : baseurl + "/images/facebook.png",
					ogurl          : ogurl,
				}, function(err, html) {
					if (err) {
						console.log(err)
					} else {
						res.send(html)
					}
				});

			}
		);
	});

	/*
	 * GET: Submit an issue
	 *
	 * Renders the submit an issue page. Does not actually
	 * submit an issue since it is a GET request.
	 */
	app.get("/issues/submit", function(req, res) {

		res.render("submit.jade", {
			mainNavigation : data.mainNavigation,
			user           : req.user,
			title          : "LSMSA SGO - Submit Issue",
			keywords       : "lsmsa, submit issue, student government, lsmsa sgo, sgo, louisiana school",
			description    : "Submit an issue to the LSMSA SGO website.",
		});

	});

	/*
	 * POST: Submit an Issue
	 *
	 * Posting to this is the issue form submission process.
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

		res.redirect("/issues");
	});

	/*
	 * POST: Adding a comment
	 *
	 * Posting to this request adds a comment to a specific
	 * issue using the issue ID passed in through the route.
	 */
	app.post("/issues/:issue_id", function(req, res) {

		/*
		 * Comment:
		 *
		 * If this exists, it means that the user is attempting
		 * to submit a comment. Submit this comment to the database,
		 * which will mark it as unapproved.
		 */
		if (req.body.comment && req.user) {

			var comment = {
				elementID : req.params.issue_id,
				googleID  : req.user.googleID,
				body      : req.body.comment
			}

			connection.query(
				"INSERT INTO comments SET ?", comment,
				function(rows, err) {
					if (err) console.log(err)
				}
			);

			res.redirect(alertLink(
				req.params.issue_id,
				"You commented.",
				"Thank you for participating in the community discussion. Check back to see if anyone replies to your words of wisdom!"
			));

		} else {
			res.redirect(alertLink(
				req.params.issue_id,
				"You are not logged in!",
				"You cannot submit a comment when you aren't logged in."
			));

			return;
		}

		res.redirect(alertLink(
			req.params.issue_id,
			"Error",
			"Unallowed HTTP POST REQ on this issue."
		));
	});

	/*
	 * GET: Specific Issues
	 *
	 * View a singular issue on a page, showing its comments,
	 * responses, and other more detailed information. It is
	 * parameterized by issue ID.
	 */
	app.get("/issues/:issue_id", function(req, res) {

		/*
		 * ADMIN - Delete:
		 *
		 * Delete this issue
		 * URL: /issues/:issue_id?action=delete
		 */
		if (req.query.action == "delete") {

			if (isAdmin(req)) {

				connection.query(
					"DELETE FROM elements WHERE id = ?", req.params.issue_id,
					function(err, rows) {
						if (err) console.log(err)
					}
				)

				res.redirect("/admin")
			}

		}

		/*
		 * ADMIN - Approve:
		 *
		 * Approve this issue.
		 * URL: /issues/:issue_id?action=approve
		 */
		if (req.query.action == "approve") {

			if (isAdmin(req)) {

				connection.query(
					"UPDATE elements SET approved = 1 WHERE id = ?", req.params.issue_id,
					function(err, rows) {
						if (err) console.log(err)
					}
				)

				res.redirect("/admin")
			}

		}

		/*
		 * ADMIN - Un-Approve:
		 *
		 * Un-approve this issue.
		 * URL: /issues/:issue_id?action=unapprove
		 */
		if (req.query.action == "unapprove") {

			if (isAdmin(req)) {

				connection.query(
					"UPDATE elements SET approved = 0 WHERE id = ?", req.params.issue_id,
					function(err, rows) {
						if (err) console.log(err)
					}
				)

				res.redirect("/admin")
			}

		}

		/*
		 * ADMIN - Resolve:
		 *
		 * Mark this issue as resolved
		 * URL: /issues/:issue_id?action=resolve
		 */
		if (req.query.action == "resolve") {

			if (isAdmin(req)) {

				connection.query(
					"UPDATE elements SET resolved = 1 WHERE id = ?", req.params.issue_id,
					function(err, rows) {
						if (err) console.log(err)
					}
				)

				var sendEmail  = require("../email-code/emails")

				sendEmail("email-welcome", {
				   	user   : user,
					issues : issues
				}, {
					to      : "connorelsea@student.lsmsa.edu",
					subject : "Welcome " + user.first + " - SGO Website"
				})

				res.redirect("/admin")
			}

		}

		/*
		 * ADMIN - Un-Resolve:
		 *
		 * Un-mark this issue as resolved.
		 * URL: /issues/:issue_id?action=unresolve
		 */
		if (req.query.action == "unresolve") {

			if (isAdmin(req)) {

				connection.query(
					"UPDATE elements SET resolved = 0 WHERE id = ?", req.params.issue_id,
					function(err, rows) {
						if (err) console.log(err)
					}
				)

				res.redirect("/admin")
			}

		}

		/*
		 * Like:
		 *
		 * Do a like action on this issue.
		 * URL: /issues/:issue_id?action=like
		 */
		if (req.query.action == "like") {

			if (req.user) {

				// Query to determine whether or not the
				// current user has liked the element
				// before.

				var QueryString = "SELECT * FROM likes WHERE googleID = " + req.user.googleID + " AND elementID = " + req.params.issue_id;

				connection.query(QueryString,

					function(err, rows) {

						console.log("UPVOTE")

						if (err) {
							console.log(err)
						}

						if (!rows || rows.length < 1) {

							var callbackRedirect = function() {

								res.redirect(alertLink(
									req.params.issue_id,
									"You upvoted this!",
									"Now that you've upvoted it, continue the discussion with a <strong>comment</strong> on this issue or a <strong>share</strong> to Facebook."
								));

							}

							doLike(
								req,
								req.params.issue_id,
								req.user.googleID,
								callbackRedirect
							);

						}

						else {

							res.redirect(alertLink(
								req.params.issue_id,
								"You've already upvoted this!",
								"You can only upvote something once. Share your opinions about this by <strong>commenting</strong> or <strong>sharing</strong> on Facebook."
							));

						}

					}

				);

			} else {

				res.redirect(alertLink(
						req.params.issue_id,
						"You are not logged in!",
						"To comment or upvote, login."
				));
			}

			return;
		}

		/*
		 * Dislike:
		 *
		 * Redirect instead of doing dislike.
		 * URL: /issues/:issue_id?action=dislike
		 */
		if (req.query.action == "dislike") {

			res.redirect(alertLink(
				req.params.issue_id,
				"Try commenting instead.",
				"If you disagree with this issue, tell us why with a comment."
			));
		}

		/*
		 * QUERY: Specific Issue Information (By ID)
		 *
		 * Load the page for the specific issue.
		 */
		connection.query(
 			"SELECT E.id, E.time, E.title, E.body, E.type, E.views, C.comments, E.googleID, E.resolved, L.likeCount\n" + 
			"FROM elements E\n" + 
			"LEFT JOIN(\n" + 
			"    SELECT elementID, GROUP_CONCAT(CASE WHEN approved = 1 THEN body ELSE NULL END ORDER BY time DESC SEPARATOR '|-|') AS comments\n" + 
			"    FROM comments\n" + 
			"    GROUP BY elementID\n" + 
			") C on C.elementID = E.id\n" + 
			"LEFT JOIN (\n" + 
			"  SELECT elementID, COUNT(id) AS likeCount\n" +
			"  FROM likes\n" +
			"  GROUP BY elementID\n" +
			") L ON L.elementID = E.id\n" +
			"WHERE E.id = " + req.params.issue_id + " AND E.approved = 1;",

			function(err, rows) {

				if (err) {

					console.log(err);
					res.redirect("/issues");

				} else {

					var issues = [];

					rows.forEach(function (row, index) {

						var new_body  = row.body;
						var new_title = row.title;

						// Push the initial issues object to
						// the  issues  array  with an empty
						// comments array.

						var issue = {
							id       : row.id,
							title    : new_title,
							date     : row.time,
							body     : new_body,
							likes    : ((row.likeCount == null) ? 0 : row.likeCount),
							views    : row.views,
							admin    : false,
							resolved : row.resolved,
							comments : []
						};

						// Query comments for individual post
						connection.query(
							"SELECT comments.id, comments.elementID, comments.googleID, comments.time, comments.body, users.name, users.admin FROM comments LEFT JOIN users ON comments.googleID = users.googleID WHERE comments.elementID = ? AND comments.approved = 1 ORDER BY comments.time DESC", issue.id,

							function (err, rows_comments)
							{
								if (err) {
									console.log(err)
								} 
								else
								{

									// Loop through all comments, create each
									// object and push it to the 
									rows_comments.forEach(function(comment, comment_index)
									{
										if (comment.admin === true) {
											issue.admin = true;
										}

										issue.comments.push({
											id    : comment.id,
											time  : comment.time.toUTCString(),
											body  : comment.body,
											name  : comment.name,
											admin : comment.admin
										});
									})

									issues.push(issue);

									var alertTitle = req.query.alertTitle;
									var alertBody  = req.query.alertBody;

									/*
									 * QUERY: Do view
									 *
									 * This query adds a view to the specific element/issue/
									 */
									connection.query(

										"UPDATE elements SET views = views + 1 WHERE id = " + req.params.issue_id,

										function(err, rows) {

											if (err) {
												console.log("Database: Unable to add views to " + req.params.issue_id);
												console.log(err);
											}

											var baseurl = req.protocol + "://" + req.hostname;
											var ogurl   = req.protocol + "://" + req.hostname + req.originalUrl;

											console.log("\n\nISSUE BEING RENDERED:\n" + JSON.stringify(issues[0]) + "\n\n")

											res.render(
												"issue-page.jade",
												{
													mainNavigation : data.mainNavigation,
													user           : req.user,
													issue          : issues[0],
													alert          : (req.query.alertTitle && req.query.alertBody) ? true : false,
													alertTitle     : alertTitle,
													alertBody      : alertBody,
													title          : "LSMSA SGO - " + issues[0].title,
													keywords       : "lsmsa, submit issue, student government, lsmsa sgo, sgo, louisiana school",
													description    : "Issue Description: " + issues[0].body,
													linkimage      : baseurl + "/images/facebook.png",
													ogurl          : ogurl
												}
											); // End of render

										}
									); // End of view query
									
								} // end of else

							} // end of function(err, rows_comments)
						)

					});

				} // End of else

			}

		);

	});

	/*
	 * ADMIN PAGE
	 *
	 * Page used by admin to approve issues
	 */
	app.get("/admin", function(req, res) {

		if (isAdmin(req)) {

			connection.query(

				"SELECT E.id, E.time, E.googleID, E.title, E.resolved, E.body, E.views, E.approved, users.name, users.email, L.likeCount\n" +
				"FROM elements E\n" +
				"LEFT JOIN users ON E.googleID = users.googleID\n" +
				"LEFT JOIN (\n" + 
				"    SELECT elementID, COUNT(id) AS likeCount\n" + 
				"    FROM likes\n" + 
				"    GROUP BY elementID\n" + 
				") L ON L.elementID = E.id\n" +
				"ORDER BY E.time DESC",

				function(err, rows) {

					var issues = [];

					async.each(
						rows,
						function(row, callback) {

							issues.push({
								id       : row.id,
								title    : row.title,
								body     : row.body,
								date     : row.time,
								likes    : ((row.likeCount == null) ? 0 : row.likeCount),
								views    : row.views,
								approved : row.approved,
								resolved : row.resolved,
								email    : row.email,
								username : row.name
							})

							console.log(row.title)

							callback()
						},

						function(err) {

							if (err) {
								console.log(err)
							}

							res.render(
								"admin.jade",
								{
									mainNavigation : data.mainNavigation,
									user           : req.user,
									rows           : issues,
									filter         : "top",
									title          : "LSMSA SGO - Admin Board"
								},
								function(err, html) {
									if (err) {
										console.log(err)
									}
									else {
										res.send(html)
									}
								}
							);	

						}
					); // End of async.each

				} // End of query callback
			)

		} // End of user checking

	})

	/*
	 * GET: Issue Page
	 * 
	 * Show a list of all issues, sorted or filtered in a manner
	 * determined by URL parameters. All of the filters and their
	 * specific instructions are handled in this route.
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
					var issues = iutil.createIssues(rows, true)

					var baseurl = req.protocol + "://" + req.hostname;

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
							filter         : "top",
							title          : "LSMSA SGO - Issue Board",
							keywords       : "lsmsa, submit issue, student government, lsmsa sgo, sgo, louisiana school",
							description    : "The Issue Board is a place where students can view, share, and discuss issues about or ideas for LSMSA as a school.",
							linkimage      : baseurl + "/images/facebook.png" 
						},
						function(err, html) {
							if (err) {
								console.log(err)
							}
							else {
								res.send(html)
							}
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
		else if (req.query.filter == "recent" || !req.query.filter) {

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
					var issues = iutil.createIssues(rows, true)

					var baseurl = req.protocol + "://" + req.hostname;

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
							filter         : "recent",
							title          : "LSMSA SGO - Issue Board",
							keywords       : "lsmsa, submit issue, student government, lsmsa sgo, sgo, louisiana school",
							description    : "The Issue Board is a place where students can view, share, and discuss issues about or ideas for LSMSA as a school.",
							linkimage      : baseurl + "/images/facebook.png" 
						},
						function(err, html) {
							if (err) {
								console.log(err)
							}
							else {
								res.send(html)
							}
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