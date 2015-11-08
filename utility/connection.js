var mysql    = require("mysql");
var database = require("../config/database");

var instance;

/*
 * Create MySQL Connection based on the location
 * of the NodeJS server, whether local or production.
 */
var createInstance = function createInstance() {
	var connection;

	console.log("---- CREATING INSTANCE ----");

	if (process.env.OPENSHIFT_NODEJS_IP) {
		connection = mysql.createConnection(database.connection);
	} else {
		connection = mysql.createConnection({
			host     : database.connection_local.host,
			user     : database.connection_local.user,
			database : database.database
		});
	}

	return connection;
}

exports.getConnection =	function getConnection() {
	console.log("---- GETTING CONNECTION ----")
	if (instance) return instance;
	else return (instance = createInstance());
}