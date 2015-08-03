var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy

var auth     = require("./auth")
var database = require("./database")
var mysql    = require("mysql")
var color    = require("cli-color")

var connection = mysql.createConnection({
	host     : database.connection.host,
    user     : database.connection.user,
    password : database.connection.password,
    database : database.database
})

function title() {
	return color.bgWhite.red("Passport:");
}

function log(text) {
	console.log(title() + " " + color.black.bgWhite(text));
}

module.exports = function(passport) {

	passport.serializeUser(function(user, done) {
		log("Serialize: Creating session with id \"" + user.googleID  + "\"")
		done(null, user.googleID)
	})

	passport.deserializeUser(function(id, done) {

        log("Deserialize: Retrieving data on \"" + id + "\" from database")

		connection.query(
			"SELECT * FROM users WHERE googleID = ?",
			[id],
			function(err, rows) {

				if(err) {
					log("Deserialize: Fatal error during query")
					done(err)
				}

				log("Deserialize: No errors occured during the query")
				log("Deserialize: Returning user information")
				done(err, rows[0])
			}
		)

	})

	passport.use(new GoogleStrategy({
		clientID     : auth.googleAuth.clientID,
		clientSecret : auth.googleAuth.clientSecret,
		callbackURL  : auth.googleAuth.callbackURL
	},
	function(token, refreshToken, profile, done) {

		log("Middleware: Using Google Strategy")

		connection.query(
			"SELECT * FROM users WHERE googleID = ? ",
			[profile.id],
			function(err, rows) {

				if (err) {
	                console.log(err);
	                return done(err)
	            }

				// User not found, create new user
				if (!rows.length) {
					log("Middleware: User with id \"" + profile.id + "\" not found, attempting new user creation")

					var user = {
						id    : profile.id,
						token : token,
						name  : profile.displayName,
						email : profile.email
					}

					log("Middleware: Attempting to insert user into database")

					var insertQuery = "INSERT INTO users (googleID, token, name, email) values (?, ?, ?, ?)"

					connection.query(
						insertQuery,
						[user.id, user.token, user.name, user.email], 
						function(err, rows) {

							if (err) {
								log("Middleware: Fatal error while inserting new user into database")
								console.log("ERROR MESSAGE: " + err)
								done(err)
							}

							log("Middleware: New user created successfully")
							return done(null, user)
						}
					)

				} // End of if(!rows.length)

				log("Middleware: User with id \"" + profile.id + " already exists")
				return done(null, rows[0])
			}
		)

	}))
}