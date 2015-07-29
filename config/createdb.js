var mysql = require('mysql');
var dbconfig = require('../config/database');

var connection = mysql.createConnection(dbconfig.connection);

connection.query('CREATE DATABASE ' + dbconfig.database);

connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.users_table + '` ( \
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    `profileID` VARCHAR(60) NOT NULL, \
    `token`     VARCHAR(60) NOT NULL, \
    `name`      VARCHAR(60) NOT NULL, \
    `email`     VARCHAR(60) NOT NULL, \
        PRIMARY KEY (`id`), \
    UNIQUE INDEX `id_UNIQUE` (`id` ASC), \
)');

console.log('Success: Database Created!')

connection.end();