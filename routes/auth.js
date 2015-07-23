var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function(app, passport) {

	app.get("/profile", function(req, res) {
		res.render("profile.jade", {
			user: req.user
		})
	})

	app.get("/logout", function(req, res) {
		req.session.destroy()
		req.logout()
		res.redirect("/")
	})

	app.get("/login", function(req, res) {
		res.render("login.jade", {
			error: false
		})
	})

	app.get(
		"/auth/google",
		passport.authenticate(
			"google",
			{ scope : ["profile", "email"] }
		)
	)

	app.get(
		"/auth/google/callback",
		passport.authenticate(
			"google",
			{
				successRedirect: "/profile",
				failureRedirect: "/failure"
			}
		)
	)
}