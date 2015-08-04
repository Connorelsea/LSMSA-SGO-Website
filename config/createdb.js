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

var create_issues =
    "CREATE TABLE " + dbconfig.tb_issues + "(" +
	"id          INT NOT NULL AUTO_INCREMENT," +
	"title       VARCHAR(300)," +
	"description TEXT,"         +
	"googleID    VARCHAR(60),"  +
	"resp_sgo    TEXT,"         +
	"resp_adm    TEXT,"         +
	"PRIMARY KEY (id)"          +
	");";

var create_news =
    "CREATE TABLE " + dbconfig.tb_news + "("   +
	"id          INT NOT NULL AUTO_INCREMENT," +
	"title       VARCHAR(300)," +
	"description TEXT,"         +
	"author      VARCHAR(60),"  +
	"body        TEXT,"         +
	"PRIMARY KEY (id)"          +
	");";

console.log("Database: Checking database...")

connection.query(show, function(err, rows, fields) {

	if (rows.length <= 0) {

		console.log("Database: " + dbconfig.database + " does not exist.")
		console.log("Database: creating database " + dbconfig.database)

		connection.query(create);
		connection.query(use);
		connection.query(create_users);
		connection.query(create_issues);
		connection.query(create_news);

		console.log('Database: Database and Tables Created');

	} else {
		console.log("Database: " + dbconfig.database + " already exists.")
	}

	console.log("Database: Ending MySQL connection.")
	connection.end();

})