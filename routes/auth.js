var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var info = require("../info/index.js")

module.exports = function(app, passport) {

	app.get("/profile", function(req, res) {
		res.render("profile.jade", {
			user: req.user
		})
	})

	app.get("/failure", function(req, res) {
		res.render("failure.jade", {
			error_loginFailed: info.error_loginFailed
		})
	})

	app.get("/logout", function(req, res) {
		req.logout()
		req.session.destroy()
		res.clearCookie("connect.sid")
		res.redirect("/")
	})

	app.get("/login", function(req, res) {

		if (req.user) {
			console.log("User " + req.user.name + " already logged in.")
			res.redirect("/")
		} else {
			res.redirect("/auth/google")
		}
		
	})

	app.get(
		"/auth/google",
		passport.authenticate(
			"google",
			{
				scope  : ["profile", "email"],
				prompt : "select_account"
			}
		)
	)

	app.get(
		"/auth/google/callback",
		passport.authenticate(
			"google",
			{
				successRedirect: "/",
				failureRedirect: "/failure"
			}
		)
	)
}