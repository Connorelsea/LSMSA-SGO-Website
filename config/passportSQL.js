var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy

var auth     = require("./auth")
var database = require("./database")
var mysql    = require("mysql")

var connection = mysql.createConnection({
	host     : database.connection.host,
    user     : database.connection.user,
    password : database.connection.password,
    database : database.database
})

module.exports = function(passport) {

	passport.serializeUser(function(user, done) {

        console.log("PASSPORT.seralizeUser")
        console.log("PASSPORT USER ID = " + user.googleID)

		done(null, user.googleID)
	})

	passport.deserializeUser(function(id, done) {

        console.log("PASSPORT.deseralizeUser")
        console.log("PASSPORT ID = " + id)

		connection.query(
			"SELECT * FROM users WHERE googleID = ?",
			[id],
			function(err, rows) {
				console.log("ERROR = " + err)
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

		console.log("PASSPORT.USE(new GoogleStrategy)")

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
					console.log("PASSPORT SQL: User not found, creating new user.")

					var user = {
						id    : profile.id,
						token : token,
						name  : profile.displayName,
						email : profile.email
					}

					console.log("PASSPORT SQL: Attempting to insert user")

					var insertQuery = "INSERT INTO users (googleID, token, name, email) values (?, ?, ?, ?)"

					connection.query(
						insertQuery,
						[user.id, user.token, user.name, user.email], 
						function(err, rows) {

							if (err) {
								console.log("PASSPORT SQL: Error during add user query!")
							}

							return done(null, user)
						}
					)

				} // End of if(!rows.length)

				console.log("HERE = " + rows[0])

				return done(null, rows[0])
			}
		)

	}))
}