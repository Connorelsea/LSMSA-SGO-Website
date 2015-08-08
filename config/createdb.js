var mysql = require('mysql');
var dbconfig = require('../config/database');

console.log("Database: Starting MySQL connection.")

var connection = mysql.createConnection(dbconfig.connection);

var show   = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = \'" + dbconfig.database + "\';"

var create = "CREATE DATABASE " + dbconfig.database + ";";

var use    = "USE " + dbconfig.database + ";";

var create_users  =
    "CREATE TABLE " + dbconfig.tb_users + "(" +
	"googleID VARCHAR(60),"  +
	"token    VARCHAR(100)," +
	"name     VARCHAR(60),"  +
	"email    VARCHAR(60),"  +
	"PRIMARY KEY (googleID)"       +
	");";

var create_elements = 
    "CREATE TABLE elements(" +
	"id          INT NOT NULL AUTO_INCREMENT," +
	"googleID    VARCHAR(60),"  +
	"title       VARCHAR(300)," +
	"body        TEXT,"         +
	"type        ENUM('blog', 'issue')," +
	"PRIMARY KEY (id)"          +
	");";

var create_comments =
    "CREATE TABLE comments("   +
	"id          INT NOT NULL AUTO_INCREMENT," +
	"elementID   INT NOT NULL," +
	"googleID    VARCHAR(60),"  +
	"body        TEXT,"         +
	"PRIMARY KEY (id)"          +
	");";

var create_likes =
    "CREATE TABLE likes("   +
	"id          INT NOT NULL AUTO_INCREMENT," +
	"elementID   INT NOT NULL," +
	"googleID    VARCHAR(60),"  +
	"PRIMARY KEY (id)"          +
	");";

var create_responses =
    "CREATE TABLE responses("   +
	"id          INT NOT NULL AUTO_INCREMENT," +
	"elementID   INT NOT NULL," +
	"title       VARCHAR(300)," +
	"body        TEXT,"         +
	"type        ENUM('sgo', 'adm')," +
	"PRIMARY KEY (id)"          +
	");";

var queries = [
	create, use, create_users, create_elements, create_comments, create_likes, create_responses
]

console.log("Database: Checking database...")

connection.query(show, function(err, rows, fields) {

	if (rows.length <= 0) {

		console.log("Database: " + dbconfig.database + " does not exist.")
		console.log("Database: creating database " + dbconfig.database)

		// connection.query(create)
		// connection.query(use)
		// connection.query(create_users)
		for (i = 0; i < queries.length; i++) {
			connection.query(queries[i])
		}

		console.log('Database: Database and Tables Created');

	} else {
		console.log("Database: " + dbconfig.database + " already exists.")
	}

	console.log("Database: Ending MySQL connection.")
	connection.end();

})