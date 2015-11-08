var connection = require("../utility/connection").getConnection();
var Promise = require("bluebird");

var curseWords = [
		"fuck", "shit", "nigger", "cock", "cum", "bitch", "ass", "whore", "arse",
		"slut", "tit", "vagina", "vag", "boob", "hore", "piss", "homo", "fag", "balls"
]

module.exports.getReviewsByDays = function getReviewsByDays(days) {

	(function() {
		return new Promise(function(resolve, reject) {

			var query = "SELECT FR.id, FR.rating, FR.body, FR.googleID, FR.date\n" +
					"FROM food AS FR\n" +
					"ORDER BY FR.date";

			connection.query(query, function(err, rows) {
				if (err) reject(err);
				else resolve(rows);
			});

		});
	})()

	.then(reviews => {
		return new Promise(function(resolve, reject) {

			var reviews   = [];

			var currentDate;
			var breakfast = [];
			var lunch     = [];
			var dinner    = [];

			reviews.forEach(review => {


				// If the next  review is not  from the date  currently  being processed,
				// push the current data set into the reviews array and begin processing
				// the next date. This  assumes that  dates are put  into order by MySQL.
				if (currentDate !== review.date) {

					reviews.push({
						date      : currentDate,
						breakfast : breakfast,
						lunch     : lunch,
						dinner    : dinner
					});

					breakfast = [];
					lunch     = [];
					dinner    = [];

				} else {

				}

				currentDate = review.date;
				reviews.push(review)

			});

			resolve(reviews);

		})
	})

	.catch(err => console.log(err))

};

module.exports.createRoutes = function createRoutes(app, passport) {

	app.get("/food", function(req, res) {
		module.exports.getReviewsByDays(5);
		res.send("TEST");
	})

};