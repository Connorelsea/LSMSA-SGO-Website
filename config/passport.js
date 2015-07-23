var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy

var User = require("../models/user.js")
var auth = require("./auth")

module.exports = function(passport) {

	passport.serializeUser(function(user, done) {
		done(null, user.id)
	})

	passport.deserializeUser(function(id, done) {

		User.findById(id, function(err, user) {
			done(err, user)
		})

	})

	passport.use(new GoogleStrategy({
		clientID     : auth.googleAuth.clientID,
		clientSecret : auth.googleAuth.clientSecret,
		callbackURL  : auth.googleAuth.callbackURL,
		realm        : "http://www.lsmsa.edu/",
		hd           : "lsmsa.edu"
	},
	function(token, refreshToken, profile, done) {

		User.findOne(
			{
				"google.id" : profile.id
			},
			function(err, user) {

				if (err) {
					return done(err)
				}

				if (user) {
					return done(null, user)
				}

				else {

					var newUser = new User()

					newUser.google.id    = profile.id
					newUser.google.token = token
					newUser.google.name  = profile.displayName
					newUser.google.email = profile.emails[0].value

					newUser.save(function(err) {
						if (err) throw err
						return done(null, newUser)
					})
				}

			}
		)

	}
	))
}