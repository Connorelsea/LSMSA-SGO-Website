var data    = require("../info/index");
var async   = require("async");
var emailer = require("../utility/emailer");
var iutil   = require("../utility/issueFunctions");
var isAdmin = require("../utility/adminFunctions")().isAdmin;
var Promise = require("bluebird");

// TODO : There are way too many different places calling basically
//        the same SQL to draw down issues. It needs to be standardized
//        so I don't have to change things in like four different places
//        to get it to work.

module.exports = function(app, passport, connection) {

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
			function(err, rows) {

				if (err) {
					console.log(err)
				}
				else {

					emailer.sendEmail([{
						title : "Issue Submission",
						body  : "Thanks " + req.user.name + " for submitting an issue. The members of LSMSA's Student Goverment will review your issue and decide whether or not to approve it. You will get a notification if your issue is approved or denied."
					}, {
						title : "Your Issue",
						body  : "Your issue, \"" + issue.title + "\" was submitted and is awaiting approval. If you have any questions please respond to this email. The body of your issue is \"" + issue.body + "\""
					}], [{
						user    : req.user,
						subject : "LSMSA SGO Website - Issue Submission"
					}], connection)

				} // End of if (err) { } else { }
			}
		) // End of connection.query

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

			// Redirect user first

			res.redirect(alertLink(
				req.params.issue_id,
				"You commented.",
				"Thank you for participating in the community discussion. Check back to see if anyone replies to your words of wisdom!"
			));

			// Then create the comment information and insert the
			// unapproved comment into the database.

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

				res.redirect("/admin")

				connection.query(
					"DELETE FROM elements WHERE id = ?", req.params.issue_id,
					function(err, rows) {

						if (err) {
							console.log(err)
						}

					}
				)

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

				res.redirect("/admin")

				(query = function() {
					return new Promise(function(resolve, reject) {

						var query = "UPDATE elements SET approved = 1 WHERE id = " + req.params.issue_id

						connection.query(query, function(err, rows) {
							if (err) reject(err)
							else resolve(rows)
						})

					})
				})()

				.then(function(return_rows) {
					return new Promise(function(resolve, reject) {

						var query = "SELECT E.id, users.name, users.first, users.last, users.email\n" +
									"FROM elements E\n" +
									"LEFT JOIN users ON E.googleID = users.googleID\n" +
									"WHERE E.id = " + req.params.issue_id

						connection.query(query, function(err, rows) {

							if (err) reject(err)
							else resolve({
								name   : rows[0].name,
								first  : rows[0].first,
								last   : rows[0].last,
								email  : rows[0].email,
								id     : rows[0].id
							})

						})

					})
				})

				.then(function(info) {

					emailer.sendEmail([{
						title : "Issue Approved!",
						body  : "Thanks " + info.name + " for submitting an issue. Your Issue has been approved and can be found at ( http://www.lsmsasgo.com/issues/" + info.id + " )"
					}], [{
						user : {
							name  : info.name,
							first : info.first,
							last  : info.last,
							email : info.email
						},
						subject : "LSMSA SGO Website - Issue Approved!"
					}], connection)

				})

				.catch(function(err) {
					console.log(err)
				})

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

				res.redirect("/admin")

				connection.query(
					"UPDATE elements SET approved = 0 WHERE id = ?", req.params.issue_id,
					function(err, rows) {
						if (err) console.log(err)
					}
				)

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

				res.redirect("/admin")

				(query = function() {
					return new Promise(function(resolve, reject) {

						var query = "UPDATE elements SET resolved = 1 WHERE id = " + req.params.issue_id

						connection.query(query, function(err, rows) {
							if (err) reject(err)
							else resolve(rows)
						})

					})
				})()

				.then(function(return_rows) {
					return new Promise(function(resolve, reject) {

						var query = "SELECT E.id, users.name, users.first, users.last, users.email\n" +
									"FROM elements E\n" +
									"LEFT JOIN users ON E.googleID = users.googleID\n" +
									"WHERE E.id = " + req.params.issue_id

						connection.query(query, function(err, rows) {

							if (err) reject(err)
							else resolve({
								name   : rows[0].name,
								first  : rows[0].first,
								last   : rows[0].last,
								email  : rows[0].email,
								id     : rows[0].id
							})

						})

					})
				})

				.then(function(info) {

					emailer.sendEmail([{
						title : "Marked as Resolved.",
						body  : "Hello " + info.name + ". Your issue ( http://www.lsmsasgo.com/issues/" + info.id + " ) has been marked by the admins as \"resolved.\" If you do not think that this is the case, please respond to this email and let us know why."
					}], [{
						user : {
							name  : info.name,
							first : info.first,
							last  : info.last,
							email : info.email
						},
						subject : "LSMSA SGO Website - Issue Resolved"
					}], connection)

				})

				.catch(function(err) {
					console.log(err)
				})

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

				res.redirect("/admin")

				connection.query(
					"UPDATE elements SET resolved = 0 WHERE id = ?", req.params.issue_id,
					function(err, rows) {
						if (err) console.log(err)
					}
				)

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

		iutil.getIssues("AND E.id = " + req.params.issue_id, connection)

		.then(iutil.buildFullIssues)

		.then(function(issues) {

			return new Promise(function(resolve, reject) {

				connection.query("SELECT comments.id, comments.elementID, comments.googleID, comments.time, comments.body, users.name, users.admin FROM comments LEFT JOIN users ON comments.googleID = users.googleID WHERE comments.elementID = ? AND comments.approved = 1 ORDER BY comments.time DESC", req.params.issue_id,
					function (err, rows) {
						if (err) reject(err)
						else resolve({ rows : rows, issues : issues}) 
					}
				)

			})

		})

		.then(function(returns) {

			return new Promise(function(resolve, reject) {

				var rows   = returns.rows
				var issues = returns.issues

				issues.forEach(function(issue) {

					// Loop through all comments, create each
					// object and push it to the 
					rows.forEach(function(comment)
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
				})

				resolve(issues)

			})

		})

		.then(function(issues) {

			return new Promise(function(resolve, reject) {

				connection.query("UPDATE elements SET views = views + 1 WHERE id = " + req.params.issue_id,
					function(err, rows) {
						if (err) reject(err)
						else resolve(issues)
					}
				);

			})

		})

		.then(function(issues) {

			var alertTitle = req.query.alertTitle;
			var alertBody  = req.query.alertBody;
			var baseurl    = req.protocol + "://" + req.hostname;
			var ogurl      = req.protocol + "://" + req.hostname + req.originalUrl;

			res.render("issue-page.jade", {
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
			})

		})

		.catch(function(err) {
			console.log("PROMISE LOADING ERROR:\n\n" + err  + "\n\n")
		})

	}) // End of app.get

	app.get("/admin-command", function(req, res) {

		// req.params.comment_id

		/*
		 * ADMIN - Comment Unapprove
		 *
		 * Approve this comment. Sends a number of email alerts to
		 * relevant users.
		 * URL: /issues/:issue_id?action=comment-approve&comment_id=123&issue_id=123
		 */

		 if (req.query.action == "comment-approve") {

			(query = function() {
				return new Promise(function(resolve, reject) {

					if (isAdmin(req)) resolve(true)
					else reject(false)

				})
			})()

			.then(function(result) {
				return new Promise(function(resolve, reject) {

					console.log(req.query.issue_id)

					var query = "SELECT users.googleID, users.email, users.name, users.first, users.last, elements.title, elements.id AS elementID\n" +
								"FROM elements\n" +
								"JOIN users ON users.googleID = elements.googleID\n" +
								"WHERE elements.id = " + req.query.issue_id + ";"

					connection.query(query, function(err, rows) {
						if (err) reject(err)
						else resolve(rows)
					})

				})
			})

			.then(function(rows) {
				return new Promise(function(resolve, reject) {

					var info = {
						uid   : rows[0].googleID,
						email : rows[0].email,
						name  : rows[0].name,
						first : rows[0].first,
						last  : rows[0].last,
						id    : rows[0].elementID
					}

					emailer.sendEmail([{
						title : "A Comment on Your Issue",
						body  : "Hello " + info.name + ". A comment on your issue ( http://www.lsmsasgo.com/issues/" + info.id + " ) has been approved. To respond or see what this anonymous user commented, click on the link."
					}], [{
						user : {
							name  : info.name,
							first : info.first,
							last  : info.last,
							email : info.email
						},
						subject : "LSMSA SGO Website - Comment on Your Issue"
					}], connection)

					resolve(info)
				})

			})

			.then(function(info) {
				return new Promise(function(resolve, reject) {

					console.log("UPDATE comments SET approved = 1 WHERE elementID = " + req.query.issue_id)

					connection.query(
						"UPDATE comments SET approved = 1 WHERE elementID = " + req.query.issue_id,
						function(err, rows) {
							if (err) reject(err)
							else resolve(rows)
						}
					)

				})
			})

			.then(function(rows) {
				return new Promise(function(resolve, reject) {
					res.redirect("/admin");
				})
			})

			.catch(function(err) {
				if (err === false) {
					console.log("Not admin...")
					res.redirect("/")
				} else {
					console.log(err)
				}
			})

		 }

	})

	/*
	 * ADMIN PAGE
	 *
	 * Page used by admin to approve issues
	 */
	app.get("/admin", function(req, res) {

		if (isAdmin(req)) {

			(query = function() {
				return new Promise(function(resolve, reject) {

					var query =
						"SELECT E.id, E.time, E.googleID, E.title, E.resolved, E.body, E.views, E.approved, users.name, users.email, L.likeCount\n" +
						"FROM elements E\n" +
						"LEFT JOIN users ON E.googleID = users.googleID\n" +
						"LEFT JOIN (\n" + 
						"    SELECT elementID, COUNT(id) AS likeCount\n" + 
						"    FROM likes\n" + 
						"    GROUP BY elementID\n" + 
						") L ON L.elementID = E.id\n" +
						"ORDER BY E.time DESC"

					connection.query(query, function(err, rows) {
						if (err) reject(err)
						else resolve(rows)
					})

				})
			})()

			.then(function(rows) {
				return new Promise(function(resolve, reject) {

					var issues = []

					async.each(rows, function(row, callback) {

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

						callback()

					}, function(err) {
						if (err) reject(err)
						else resolve(issues)
					})

				})
			})

			.then(function(issues) {
				return new Promise(function(resolve, reject) {

					var query =
						"SELECT C.id, C.elementID, C.googleID, C.time, C.body, C.approved, users.name, elements.title as elementTitle\n" +
						"FROM comments C\n" +
						"JOIN users ON C.googleID = users.googleID\n" +
						"JOIN elements ON C.elementID = elements.id\n" +
						"ORDER BY C.time DESC"

					connection.query(query, function(err, rows) {
						if (err) reject(err)
						else resolve({
							issues : issues,
							rows   : rows
						})
					})

				})
			})

			.then(function(container) {
				return new Promise(function(resolve, reject) {

					var issues   = container.issues
					var comments = []
					var rows     = container.rows

					async.each(rows, function(row, callback) {

						comments.push({
							id           : row.id,
							elementID    : row.elementID,
							time         : row.time,
							body         : row.body,
							approved     : row.approved,
							username     : row.name,
							elementTitle : row.elementTitle
						})

						callback()

					}, function(err) {
						if (err) reject(err)
						else resolve({
							issues   : issues,
							comments : comments
						})
					})

				})
			})

			.then(function(container) {
				return new Promise(function(resolve, reject) {

					var issues   = container.issues
					var comments = container.comments

					res.render(
						"admin.jade",
						{
							mainNavigation : data.mainNavigation,
							user           : req.user,
							rows           : issues,
							comments       : comments,
							filter         : "top",
							title          : "LSMSA SGO - Admin Board"
						},
						function(err, html) {
							if (err) reject(err)
							else resolve(html)
						}
					);	

				})
			})

			.then(function(html) {
				res.send(html)
			})

			.catch(function(err) {
				console.log("Error while loading admin panel: " + err)
			})

		}

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
		var baseurl = req.protocol + "://" + req.hostname;

		/*
		 * FILTER: Top
		 *
		 * Sorts the post by number of votes in descending order
		 * from the top of the page.
		 */
		if (req.query.filter == "top") {

			iutil.getIssues("ORDER BY L.likeCount DESC", connection)

			.then(iutil.buildIssues)

			.then(function(issues) {
				return new Promise(function(resolve, reject) {

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
								reject(err)
							}
							else {
								resolve(html)
							}
						}
					);	

				})
			})

			.then(function(html) {
				res.send(html)
			})

			.catch(function(err) {
				console.log("Error while sorting by top: " + err)
			})

		}

		/*
		 * FILTER: Recent
		 *
		 * Sorts the most recent posts by dates in descending order
		 * from the top of the page.
		 */
		else if (req.query.filter == "recent" || !req.query.filter) {

			iutil.getIssues("ORDER BY E.time DESC", connection)

			.then(iutil.buildIssues)

			.then(function(issues) {
				return new Promise(function(resolve, reject) {

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
								reject(err)
							}
							else {
								resolve(html)
							}
						}
					);	

				})
			})

			.then(function(html) {
				res.send(html)
			})

			.catch(function(err) {
				console.log("Error while sorting by recent: " + err)
			})

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

	/*
	 * GET: News Page
	 *
	 * Renders the submit an issue page. Does not actually
	 * submit an issue since it is a GET request.
	 */
	app.get("/news", function(req, res) {

		(query = function() {
			return new Promise(function(resolve, reject) {

				var query = `
					SELECT E.id, E.time, E.googleID, E.title, E.body, E.type, E.views, users.name
					FROM elements E
					LEFT JOIN users ON ER.googleID = users.googleID
					WHERE TYPE = 'news'
					ORDER BY E.time DESC
				`;

				connection.query(query, function(err, rows) {
					if (err) reject(err)
					else resolve(rows)
				})

			})
		})()

		.then(function(issues) {
				return new Promise(function(resolve, reject) {

				}
		});

		res.render("news.jade", {
			mainNavigation : data.mainNavigation,
			user           : req.user,
			title          : "LSMSA SGO - News"
		});
	}

}