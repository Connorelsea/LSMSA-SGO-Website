var express      = require("express"),
    mongoose     = require("mongoose"),
    passport     = require("passport"),
    flash        = require("connect-flash"),
    morgan       = require("morgan"),
    cookieParser = require("cookie-parser"),
    bodyParser   = require("body-parser"),
    session      = require("express-session"),
    stylus       = require("stylus"),
    nib          = require("nib"),
    mysql        = require("mysql"),
    database     = require("./config/database")

// Setup MySQL databases

require("./config/createdb")

var connection;

if (process.env.OPENSHIFT_NODEJS_IP) {

    connection = mysql.createConnection(database.connection);

} else {

    connection = mysql.createConnection({
        host     : database.connection_local.host,
        user     : database.connection_local.user,
        database : database.database
    });

}

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

app.use(session({
	secret : info.cookie.secret,
	maxAge : 360 * 5
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

// Setup Routes

require("./routes/index.js") (app, passport)
require("./routes/auth.js")  (app, passport)
require("./routes/issues.js")(app, passport, connection)

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
        res.redirect("/");
    }

});

// Launch Application

var ip   = process.env.OPENSHIFT_NODEJS_IP   || "localhost"
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000

app.listen(port, ip, function() {
    console.log("Application: Now running on " + ip + ":" + port)
});