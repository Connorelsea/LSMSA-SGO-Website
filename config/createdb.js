var mysql = require('mysql');
var dbconfig = require('../config/database');

var connection = mysql.createConnection(dbconfig.connection);

console.log("Running ")
var create = "CREATE DATABASE " + dbconfig.database + ";";

var use    = "USE " + dbconfig.database + ";";

var query  = "CREATE TABLE " + dbconfig.tb_users + "(" +
	         "googleID VARCHAR(60),"  +
	         "token    VARCHAR(100)," +
	         "name     VARCHAR(60),"  +
	         "email    VARCHAR(60)"  +
	         ");";

connection.query(create);
connection.query(use);
connection.query(query);

console.log('Success: Database Created!');

connection.end();