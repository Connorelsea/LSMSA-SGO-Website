var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var info = require("../info/index.js")

module.exports = function(app, passport) {

	app.get("/profile", function(req, res) {

		var baseurl = req.protocol + "://" + req.hostname;

		res.render("profile.jade", {
			user: req.user,
			title          : "LSMSA SGO - Home",
			keywords       : "lsmsa, student government, lsmsa sgo, sgo, louisiana school",
			description    : "The official LSMSA SGO website made for students, by students.",
			linkimage      : baseurl + "/images/facebook.png",
			ogurl          : ogurl,
		})
	})

	app.get("/failure", function(req, res) {

		res.render("alert-page.jade", {
			title   : "Login Failed",
			body    : "You must use your LSMSA email address when logging into the SGO website.",
			buttons : [
				//{ title : "Home", link : "/" },
				{ title : "Login Again", link : "/login" }
			],
			title          : "LSMSA SGO - Error",
		})

	})

	app.get("/logout", function(req, res) {
		req.logout()
		req.session.destroy()
		res.clearCookie("connect.sid")
		res.redirect("/")
	})

	app.get("/login-welcome", function(req, res) {

		if (req.user) {
			console.log("User " + req.user.name + " already logged in.")
			res.redirect("/")
		} else {

			res.render("alert-page.jade", {
				title   : "LSMSA SGO",
				body    : "Logging into the LSMSA SGO website gives you the ability to create issues and participate in community discussion.Note that you can only log in with your LSMSA email.",
				buttons : [
					//{ title : "Home", link : "/" },
					{ title : "Login", link : "/login" }
				],
				title          : "LSMSA SGO - Alert"
			})

		}

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