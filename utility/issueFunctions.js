var Promise = require("bluebird")
var async   = require("async")

exports.createIssues = function (rows, wrap) {
	var issues = [];

	// Loop throug every issue that was
	// returned by the SQL query.
	for (var i = 0; i < rows.length; i++) {

		var new_body  = rows[i].body;
		var new_title = rows[i].title;

		if (wrap == true) {

			if (new_body.length > 105) {
				new_body = new_body.substring(0, 105) + "...";
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
			views    : rows[i].views,
			admin    : false,
			resolved : rows[i].resolved,
			comments : []
		});

		console.log(new_title + " RESOLVED: " + rows[i].resolved)

		console.log("VIEWS: " + rows[i].views)

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

			// ADD IN SECOND QUERY FOR COMMENTS SIMILAR TO LOWER
			// QUERY IN ORDER TO CHECK FOR ADMIN OR NOT. CURRENTLY
			// COMMENTS ARE ONLY BEING RETURNED AS TEXT. Need to
			// check for admin so the issue box itself can show
			// the alert. This query for the issue box needs to
			// be modernized like it was modernized for the issue
			// page as a whole. MAYBE GROUP_CONCAT 1s and 0s.

			issues[i].comments.push({
				body : comments[c]
			});
		}
	}

	return issues;
}

exports.buildFullIssues = function(rows) {

	return new Promise(function(resolve, reject) {

		var issues = []

		async.each(rows,
			function(row, callback) {

				var new_body  = row.body;
				var new_title = row.title;
				
				issues.push({
					id       : row.id,
					title    : new_title,
					date     : row.time,
					body     : new_body,
					likes    : ((row.likeCount == null) ? 0 : row.likeCount),
					views    : row.views,
					admin    : false,
					comments : [],
					resolved : row.resolved
				})

				callback()
			},
			function(err) {

				if (err) reject(err)
				else resolve(issues)

			}
		)

	})

}

exports.buildIssues = function(rows) {

	return new Promise(function(resolve, reject) {

		var issues = []

		async.each(rows,
			function(row, callback) {

				var new_body  = row.body;
				var new_title = row.title;

				if (new_body.length > 105) new_body = new_body.substring(0, 105) + "...";
				if (new_title.length > 50) new_title = new_title.substring(0, 50) + "...";
			
				issues.push({
					id       : row.id,
					title    : new_title,
					date     : row.time,
					body     : new_body,
					likes    : ((row.likeCount == null) ? 0 : row.likeCount),
					views    : row.views,
					admin    : false,
					comments : [],
					resolved : row.resolved
				})

				callback()
			},
			function(err) {

				if (err) reject(err)
				else resolve(issues)

			}
		)

	})

}

exports.getIssues = function(orderBy, connection) {

	return new Promise(function(resolve, reject) {

		connection.query(

			"SELECT E.id, E.time, E.title, E.body, E.type, E.resolved, E.approved, E.views, E.googleID, L.likeCount\n" + 
			"FROM elements E\n" + 
			"LEFT JOIN (\n" + 
			"    SELECT elementID, COUNT(id) AS likeCount\n" + 
			"    FROM likes\n" + 
			"    GROUP BY elementID\n" + 
			") L ON L.elementID = E.id\nWHERE E.approved = 1\n" + orderBy,

			function(err, rows) {

				if (err) reject(err)
				else resolve(rows)
			}

		)

	})

}

exports.queryIssues = function(orderBy, connection, callback) {

		connection.query(
			/*
			 * Return list of posts with numbers of upvotes.
			 * Posts that have no upvotes have a NULL value
			 * in the likeCount column.
			 */
			"SELECT E.id, E.time, E.title, E.body, E.type, E.resolved, E.approved, E.views, C.comments, E.googleID, L.likeCount\n" + 
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
