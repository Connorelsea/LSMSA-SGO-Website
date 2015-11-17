var express      = require("express"),
	passport     = require("passport"),
	flash        = require("connect-flash"),
	morgan       = require("morgan"),
	cookieParser = require("cookie-parser"),
	bodyParser   = require("body-parser"),
	session      = require("express-session"),
	stylus       = require("stylus"),
	nib          = require("nib"),
	mysql        = require("mysql"),
	database     = require("./config/database"),
	favicon      = require("serve-favicon"),
	nodemailer   = require("nodemailer"),
	auth         = require("./config/auth"),
	EmailTemp    = require("email-templates").EmailTemplate,
	path         = require("path"),
	emails       = require("./email-code/emails"),
	isAdmin      = require("./utility/adminFunctions")().isAdmin,
	SessionStore = require("express-mysql-session")

// Setup MySQL databases

require("./config/createdb")

var connection  = require("./utility/connection").getConnection();

// Express Application Setup

var app = express()

function compile(str, path) {
	return stylus(str)
		.set('filename', path)
		.use(nib())
}

app.use(morgan("dev"))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

app.use(stylus.middleware(
	{ src: __dirname + '/public'
		, compile: compile
	}
))

app.use(express.static('public'));

// Passport and Session Setup

require("./config/passportSQL.js")(passport, connection)

var info = require("./config/auth")

var sessionStore = new SessionStore({}/* session store options */, connection);

app.use(session({
	secret : info.cookie.secret,
	store  : sessionStore
	//maxAge : 360 * 5
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

// Check if user is admin on each request
app.use(function (req, res, next) {

	if (req.user) {
		if (isAdmin(req)) req.user.isAdmin = true;
		else req.user.isAdmin = false;
	}

	next();
})


app.use(favicon(__dirname + '/public/favicon.ico'));

// Setup Routes

require("./routes/index.js") (app, passport)
require("./routes/auth.js")  (app, passport)
require("./routes/issues.js")(app, passport, connection)

require("./routes/food.js").createRoutes(app, passport)

// Error Handling

app.use(function(err, req, res, next) {

	if (err.code === 404 || err.code == 404) {

		res.render("alert-page.jade", {
			title   : "404: Page Not Found",
			body    : "Page not found on the LSMSA SGO website. Try one of these.",
			buttons : [
				{ title : "Home", link : "/" },
				{ title : "Issue Board", link : "/issues" }
			]
		});

	}

	if (err.code === 500) {
		res.redirect("/failure");
	}

	if (err) {
		console.log("\n\n\nFATAL GLOBAL ERROR:\n\n" + err + "\n\n\n")
		res.redirect("/");
	}

});

// Launch Application

var ip   = process.env.OPENSHIFT_NODEJS_IP   || "localhost"
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000

app.listen(port, ip, function() {
	console.log("Application: Now running on " + ip + ":" + port)
});