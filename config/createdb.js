var mysql    = require('mysql');
var dbconfig = require('../config/database');
var async    = require('async'); 

console.log("Database: Starting MySQL connection.")

var database = "lsmsa";

if (process.env.OPENSHIFT_NODEJS_IP) {

	console.log("Database: Attempting to use OpenShift credentials.")

	connection = mysql.createConnection(dbconfig.connection);
	database   = dbconfig.connection.database;

	console.log("Database: Connected using OpenShift credentials.")

} else {

	console.log("Database: Attempting to use local credentials")

	connection = mysql.createConnection(dbconfig.connection_local)
	database   = dbconfig.database;

	console.log("Database: Connected using local credentials.")
}

var show   = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = \'" + database + "\';"

var create = "CREATE DATABASE " + database + ";";

var use    = "USE " + database + ";";

var create_users  =
    "CREATE TABLE IF NOT EXISTS users(" +
	"googleID VARCHAR(60),"  +
	"token    VARCHAR(100)," +
	"name     VARCHAR(60),"  +
	"email    VARCHAR(60),"  +
	"PRIMARY KEY (googleID)" +
	");";

var create_elements_trigger =
	"CREATE TRIGGER `ELEMENTS_INSERT` BEFORE INSERT ON `elements`\n" +
	"FOR EACH ROW BEGIN\n" +
	"    SET new.time = now();\n" +
	"END;";

var create_elements = 
    "CREATE TABLE IF NOT EXISTS elements(\n" +
	"id          INT NOT NULL AUTO_INCREMENT,\n" +
	"googleID    VARCHAR(60),\n"  +
	"time        DATETIME,\n" +
	"title       VARCHAR(300),\n" +
	"body        TEXT,\n"         +
	"type        ENUM('blog', 'issue'),\n" +
	"PRIMARY KEY (id)\n"          +
	");";

var create_comments =
    "CREATE TABLE IF NOT EXISTS comments("   +
	"id          INT NOT NULL AUTO_INCREMENT," +
	"elementID   INT NOT NULL," +
	"googleID    VARCHAR(60),"  +
	"body        TEXT,"         +
	"PRIMARY KEY (id)"          +
	");";

var create_likes =
    "CREATE TABLE IF NOT EXISTS likes("   +
	"id          INT NOT NULL AUTO_INCREMENT," +
	"elementID   INT NOT NULL," +
	"googleID    VARCHAR(60),"  +
	"PRIMARY KEY (id)"          +
	");";

var create_responses =
    "CREATE TABLE IF NOT EXISTS responses("   +
	"id          INT NOT NULL AUTO_INCREMENT," +
	"elementID   INT NOT NULL," +
	"title       VARCHAR(300)," +
	"body        TEXT,"         +
	"type        ENUM('sgo', 'adm')," +
	"PRIMARY KEY (id)"          +
	");";

var queries = [
	create, use, create_users, create_elements, create_elements_trigger, create_comments, create_likes, create_responses
]

console.log("Database: Checking database...")

/*
 * OpenShift Database Creation
 *
 * Specific instructions for creating the tables when
 * hosted on the OpenShift server.
 */

console.log("Database: Attempting table creation.");

connection.query(use, function(err) {

	async.forEach(
		queries,
		function(query, callback) {

			connection.query(query, function(err) {

				if (err) {
					console.log("Database: There was an error during async query.");
					console.log(err);
				}

				callback();
			});

		},
		function(err) {
			connection.end();
		}
	);

});

console.log("Database: Done with table creation.");