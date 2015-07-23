var express      = require("express"),
    mongoose     = require("mongoose"),
    passport     = require("passport"),
    flash        = require("connect-flash"),
    morgan       = require("morgan"),
    cookieParser = require("cookie-parser"),
    bodyParser   = require("body-parser"),
    session      = require("express-session"),
    sass         = require("node-sass")
    sassMiddle   = require("node-sass-middleware")

// Database Configuration and Setup
var databaseConfig = require("./config/database.js").databaseConfig
mongoose.connect(databaseConfig.url)

// Express Application Setup

var app = express()

app.use(express.static('public'));
app.use(morgan("dev"))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.set("view engine", "jade")

app.use(sassMiddle({
	src   : __dirname + "/sass",
	dest  : __dirname + "/public/css",
	debug : true
}))

// Passport and Session Setup

app.use(session({ secret: " " }))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

require("./config/passport.js")(passport)

// Setup Routes

require("./routes/index.js")(app, passport)
require("./routes/auth.js") (app, passport)

// Launch Application

var port = process.env.PORT || 3000
app.listen(port)

console.log("Application is running on port " + port)