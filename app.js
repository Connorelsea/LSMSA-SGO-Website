var express      = require("express"),
    mongoose     = require("mongoose"),
    passport     = require("passport"),
    flash        = require("connect-flash"),
    morgan       = require("morgan"),
    cookieParser = require("cookie-parser"),
    bodyParser   = require("body-parser"),
    session      = require("express-session"),
    stylus       = require("stylus"),
    nib          = require("nib")

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

require("./config/passportSQL.js")(passport)

var info = require("./config/auth")

app.use(session({
	secret : info.cookie.secret,
	maxAge : 360 * 5
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

// Setup Routes

require("./routes/index.js")(app, passport)
require("./routes/auth.js") (app, passport)

// Error Handling

app.use(function(err, req, res, next) {

    if (err.code === 500) {
        res.redirect("/failure")
    }

});

// Launch Application

var port = process.env.PORT || 3000
app.listen(port)

console.log("Application is running on port " + port)