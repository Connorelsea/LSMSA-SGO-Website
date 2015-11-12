var connection = require("../utility/connection").getConnection();
var data       = require("../info/index");
var Promise   = require("bluebird");

var curseWords = [
		"fuck", "shit", "nigger", "cock", "cum", "bitch", "ass", "whore", "arse",
		"slut", "tit", "vagina", "vag", "boob", "hore", "piss", "homo", "fag"
]

module.exports.postReview = function postReview(review) {

	var query = `INSERT INTO food SET ?`

	connection.query(query, review, function(err, rows) {
		if (err) console.log(err);
	})
}

module.exports.getReviewsByDays = function getReviewsByDays(days) {

	return new Promise(function(resolve, reject) {

		var query = `
			SELECT FR.id, FR.rating, FR.body, FR.googleID, FR.date, FR.meal
			FROM food AS FR
			ORDER BY FR.date DESC
		`

		connection.query(query, function(err, rows) {
			if (err) reject(err);
			else resolve(rows);
		});
	})

	.then(reviews => {

		var currentDate;
		var dates = [];

		var breakfast = [];
		var brunch    = [];
		var lunch     = [];
		var dinner    = [];

		reviews.forEach(review => {

			if (!currentDate) currentDate = review.date;

			// If the next  review is not  from the date  currently  being processed,
			// push the current data set into the reviews array and begin processing
			// the next date. This  assumes that  dates are put  into order by MySQL.
			if (currentDate.toDateString() != review.date.toDateString()) {

				// Add the current date object to an  array of all  dates. The
				// date object contains a JS date object and an array for each
				// meal. The array for each meal contains reviews.
				dates.push({
					date      : currentDate,
					meals     : { breakfast, brunch, lunch, dinner }
				});

				// Clear each meal array so that they can be filled with the reviews
				// from the next day that will be processed.
				breakfast = [];
				brunch    = [];
				lunch     = [];
				dinner    = [];

				// Update the current date
				currentDate = review.date;
			}

			// Add the current date to it's specific meal array
			if      (review.meal === "BREAKFAST") breakfast.push(review);
			else if (review.meal === "BRUNCH")    brunch.push(review);
			else if (review.meal === "LUNCH")     lunch.push(review);
			else if (review.meal === "DINNER")    dinner.push(review);
		});

			// Add the final date object if there are any more
		if (breakfast.length > 0 || brunch.length > 0 || lunch.length > 0 || dinner.length > 0) {
			dates.push({
				date: currentDate,
				meals: {breakfast, brunch, lunch, dinner}
			});
		}

		return dates;
	})

};

module.exports.createRoutes = function createRoutes(app, passport) {

	app.get("/food", (req, res) => {

		module.exports.getReviewsByDays(5)

		.then(dates => res.render("food.jade", {
			mainNavigation : data.mainNavigation,
			user            : req.user,
			dates           : dates
		}))

		.catch(err => console.log(err));

	});

	app.post("/food/submit", (req, res) => {

		module.exports.postReview({
			rating : req.body.rating,
			body   : req.body.text,
			meal   : req.body.select.toUpperCase()
		})

		res.redirect("/food");
	});

};