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

if (process.env.OPENSHIFT_NODEJS_IP) {

    var connection = mysql.createConnection({
        host     : database.connection.host,
        user     : database.connection.user,
        password : database.connection.password,
        database : database.database
    });

} else {

    var connection = mysql.createConnection({
        host     : database.connection_local.host,
        user     : database.connection_local.user,
        database : database.database_local
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

    if (err.code === 500) {
        res.redirect("/failure")
    }

});

// Launch Application

var ip   = process.env.OPENSHIFT_NODEJS_IP   || "127.0.0.1"
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000
// app.listen(ip, port)
app.listen(port, ip);

console.log("Application: Now running on " + ip + ":" + port)