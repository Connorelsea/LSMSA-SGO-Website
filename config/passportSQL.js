var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy

var auth     = require("./auth")
var database = require("./database")
var mysql    = require("mysql")
var color    = require("cli-color")

function title() {
	return color.bgWhite.red("Passport:");
}

function log(text) {
	console.log(title() + " " + color.black.bgWhite(text));
}

module.exports = function(passport, connection) {

	passport.serializeUser(function(user, done) {

		if (user.id) {

			log("Serialize: Creating session with id \"" + user.id  + "\".");
			done(null, user.id);

		} else {

			log("Serialize: Creating session with id \"" + user.googleID  + "\".");
			done(null, user.googleID);

		}

	})

	passport.deserializeUser(function(id, done) {

        log("Deserialize: Retrieving data on \"" + id + "\" from database.");

		connection.query(
			"SELECT * FROM users WHERE googleID = ?",
			[id],
			function(err, rows) {

				if(err) {
					log("Deserialize: Fatal error during query.");
					done(err);
				}

				log("Deserialize: No errors occured during the query.");
				log("Deserialize: Returning user information.");
				done(err, rows[0]);
			}
		)

	})

	passport.use(new GoogleStrategy({
		clientID     : auth.googleAuth.clientID,
		clientSecret : auth.googleAuth.clientSecret,
		callbackURL  : auth.googleAuth.callbackURL
	},
	function(token, refreshToken, profile, done) {

		log("Middleware: Using Google Strategy.");

		connection.query(
			"SELECT * FROM users WHERE googleID = ? ",
			[profile.id],
			function(err, rows) {

				// Check for any odd errors that may have
				// occured during the query.

				log("Middleware: Checking for initial errors.")

				if (err) {
	                console.log(err);
	                return done(err);
	            } else {
	            	log("Middleware: No initial errors found.")
	            }

	            // If there are no initial errors, check if
	            // the user has been previously created and
	            // is already in the database. If the  that
	            // is so, return the user.

	            if (rows.length > 0) {

					log("Middleware: User with id \"" + profile.id + " already exists.");
					return done(null, rows[0]);

				}

	            // Ensure that the email address being used
	            // belongs to an LSMSA student or  an LSMSA
	            // teacher

	            log("Middleware: Verifying email domain...")
	            var domain = profile._json.domain;

	            if (domain !== "student.lsmsa.edu" && domain !== "lsmsa.edu") {

	            		log("Middleware: Email domain " + domain + " not allowed.");

						var error = new Error();
 						error.code = 500;

 						return done(error, null);

	            } else {
	            	log("Middleware: LSMSA domain verified with " + domain);
	            }

				// The email verification process has been passed,
				// but the user is not found in the database

				if (!rows.length) {

					log("Middleware: User with id \"" + profile.id + "\" not found, attempting new user creation.")
					log("Middleware: Verifying email domain...");
					log("Middleware: LSMSA domain verified.");
					log("PROFILE: " + JSON.stringify(profile))

					var user = {
						id    : profile.id,
						token : token,
						name  : profile.displayName,
						first : profile.name.givenName,
						last  : profile.name.familyName,
						email : profile.emails[0].value
					}

					// Insert the user information into the
					// database and then return the user in
					// the query callback  if  the database

					log("Middleware: Attempting to insert user into database.");

					var insertQuery = "INSERT INTO users (googleID, token, name, first, last, email) values (?, ?, ?, ?, ?, ?)";

					connection.query(
						insertQuery,
						[user.id, user.token, user.name, user.first, user.last, user.email], 
						function(err, rows) {

							if (err) {

								log("Middleware: Fatal error while inserting new user into database.");
								console.log("ERROR MESSAGE: " + err);
								return done(err);

							} else {

								// If registration was successful, send them a
								// registration email with information and new issues, etc.

								connection.query(
									/*
									 * Return list of posts with numbers of upvotes.
									 * Posts that have no upvotes have a NULL value
									 * in the likeCount column.
									 */
									"SELECT E.id, E.time, E.title, E.body, E.type, E.approved, E.views, C.comments, E.googleID, L.likeCount\n" + 
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
									") L ON L.elementID = E.id\nWHERE E.approved = 1\n" +
									"ORDER BY E.id DESC LIMIT 4",

									function(err, rows) {

										if (err) {

											console.log("Error upon registration of " + req.user)

										} else {

											var emailer = require("../utility/emailer")

											emailer.sendEmail([{
												title : "Hello\, " + user.first,
												body  : "Welcome and thank you for registering for LSMSA's Student Government Organization website. The purpose of this website is twofold - to give students another avenue by which to express their concerns, and to keep the student body more informed about the process of Student Government at LSMSA."
											}], [{
												user    : user,
												subject : "Welcome " + user.first + " - LSMSA SGO Website"
											}], connection)

										} // End of if(err) {} else {}

									}

								);// End of query for registration email issues

							}

							log("Middleware: New user created successfully.");
							return done(null, user);
						}
					)

				} // End of if(!rows.length)
			}
		)

	}))
}