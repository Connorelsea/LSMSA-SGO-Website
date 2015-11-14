var connection = require("../utility/connection").getConnection();
var data       = require("../info/index");
var Promise    = require("bluebird");
var moment     = require("moment");

var curseWords = [
		"fuck", "shit", "nigger", "cock", "cum", "bitch", "ass", "whore", "arse",
		"slut", "vagina", "vag", "boob", "piss", "homo", "fag", "dick"
]

module.exports.postReview = function postReview(review) {

	(function() {
		return new Promise(function(resolve, reject) {
			if (review.googleID) resolve(review);
			else reject();
		})
	})()

	.then(review => {

		var hasWord = false;

		curseWords.forEach(word => {
			if (review.body.toLowerCase().indexOf(word) > -1) hasWord = true;
		})

		if (hasWord) throw new Error("Curse Word Detected")
		else return review;

	})

	.then(review => {

		var query = `INSERT INTO food SET ?`

		connection.query(query, review, function(err, rows) {
			if (err) throw err;
		})

	})

	.catch(err => console.log(err));

}

module.exports.getReviewsByDays = function getReviewsByDays(days) {

	return new Promise((resolve, reject) => {

		var currentDate = moment().format();
		var dates = [];

		// Create an array of date objects that contain a range  from
		// the current date to x amount of days ago. X amount of days
		// is determined by the "days" argument.
		for (var i = 0; i < days; i++) {
			dates.push(moment().subtract(i, "days"));
		}

		resolve(dates);
	})

	.then(dates => {

		var dateObjects = [];

		// Create an object the will encapsulate the information
		// for each date in the previously specified range.
		dates.forEach(date => dateObjects.push({
			date  : new Date(date),
			meals : {}
		}))

		return dateObjects;
	})

	.then(dateObjects => {

		var query = `
			SELECT FR.id, FR.rating, FR.body, FR.googleID, FR.date, FR.meal
			FROM food AS FR
			ORDER BY FR.date DESC
		`

		return Promise.fromCallback(function(callback) {
			connection.query(query, (err, rows) => {
				if (err) callback(err);
				else callback(null, {dateObjects, rows});
			})
		});

	})

	.then(container => {

		var dateObjects = container.dateObjects;
		var rows        = container.rows;

		// Cycle through each date object in that range
		dateObjects.forEach(object => {

			// Get the reviews that match the date of the current date object
			// and then fill that date object with those reviews.

			var reviews = rows.filter(row => {
				return row.date.toDateString() === object.date.toDateString()
			})

			// Filter the reviews into their respective meal arrays

			var breakfast = reviews.filter(r => { return r.meal === "BREAKFAST" });
			var brunch    = reviews.filter(r => { return r.meal === "BRUNCH" });
			var lunch     = reviews.filter(r => { return r.meal === "LUNCH" });
			var dinner    = reviews.filter(r => { return r.meal === "DINNER" });

			// Populate the dataObject with their meal arrays

			object.meals.breakfast = breakfast;
			object.meals.brunch    = brunch;
			object.meals.lunch     = lunch;
			object.meals.dinner    = dinner;

		})

		return dateObjects;

	})

	.then(dateObjects => {

		// Find average of the review ratings for each meal and
		// for the entire day

		dateObjects.forEach(object => {

			function findAverage(mealName) {

				var meal    = object.meals[mealName];
				var avg     = 0;
				var length  = meal.length;

				meal.forEach(review => avg = avg + review.rating);
				
				avg = Math.round((avg / length) * 100) / 100;
				if (isNaN(avg)) avg = 0;

				return (avg);

			}

			var avg_bf = findAverage("breakfast");
			var avg_br = findAverage("brunch");
			var avg_lu = findAverage("lunch");
			var avg_di = findAverage("dinner");

			object.statistics = {
				avg_breakfast : avg_bf,
				avg_brunch     : avg_br,
				avg_lunch      : avg_lu,
				avg_dinner     : avg_di,
				avg_day        : (avg_bf + avg_br + avg_lu + avg_di) / 4
			}

		})

		return dateObjects;
	})

};

module.exports.createRoutes = function createRoutes(app, passport) {

	app.get("/food", (req, res) => {

		module.exports.getReviewsByDays(5)

		.then(dates => res.render("food.jade", {
			mainNavigation : data.mainNavigation,
			title           : "Meal Review",
			user            : req.user,
			dates           : dates
		}))

		.catch(err => console.log(err));

	});

	app.post("/food/submit", (req, res) => {

		module.exports.postReview({
			rating   : req.body.rating,
			body     : req.body.text,
			meal     : req.body.select.toUpperCase(),
			googleID : req.user.googleID
		})

		res.redirect("/food");
	});

};