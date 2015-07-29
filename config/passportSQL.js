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
		done(null, user.id)
	})

	passport.deserializeUser(function(id, done) {
        console.log("PASSPORT.deseralizeUser")
		connection.query("SELECT * FROM users WHERE id = ?", [id], function(err, rows) {
			done(err, rows[0])
		})

	})

	passport.use(new GoogleStrategy({
		clientID     : auth.googleAuth.clientID,
		clientSecret : auth.googleAuth.clientSecret,
		callbackURL  : auth.googleAuth.callbackURL
	},
	function(token, refreshToken, profile, done) {

		connection.query("SELECT * FROM users WHERE id = ? ", [profile.id], function(err, rows) {

			if (err) {
                console.log(err);
                return done(err)
            }

			// User not found, create new user
			if (!rows.length) {
                console.log("ROWS ! LENGTH HERE HERE HERE HERE")

				var user = {
					id    : profile.id,
					token : token,
					name  : profile.displayName,
					email : profile.email
				}

				var insertQuery = "INSERT INTO users (id, token, name, email) values (?, ?, ?, ?)"

				connection.query(
					insertQuery,
					[user.id, user.token, user.name, user.email], 
					function(err, rows) {
						user.sqlid = rows.insertId
						return done(null, user)
					}
				)

			}

			return done(null, rows[0])
		})

	}))
}