var Promise = require("bluebird")

/*
 * Function: Send General Email
 * 
 * containers : [ { title, body } ]
 * users      : [ { name, first, last, email, subject } ]
 */
exports.sendEmail = function(containers, users, connection) {

	var util = require("./issueFunctions")

	util.getIssues("ORDER BY E.id DESC", connection)

	.then(util.buildIssues)

	.then(function(issues) {

		sendRawEmail = require("./emailer").sendRawEmail

		users.forEach(function(user) {

			sendRawEmail("email-welcome", {
				containers : containers,
				user       : user,
				issues     : issues
			}, {
				to      : user.email,
				subject : user.subject
			})

		})

	})

	.catch(function(err) {
		console.log("Error in email promise " + err)
	})

}

// Required modules for sending email
var auth           = require("../config/auth")
var nodemailer     = require("nodemailer")
var EmailTemplate  = require("email-templates").EmailTemplate
var path           = require("path")

/*
 * Function: Send Raw Email
 */
exports.sendRawEmail = function (templateName, templateInput, mailInput) {

	// Template creation
	var template  = new EmailTemplate("./emails/" + templateName)

	// Rendering template based on input data. The
	// results returned are the 
	template.render(templateInput, function(err, results) {

		if (err) {
			console.log("\n\nEmail Error\n\n" + err + "\n\n")
		}

		else {

			// Assume Gmail transport
			var transporter = nodemailer.createTransport({
				service : "Gmail",
				auth    : auth.mailer.auth
			})

			// Building input that will be taken by the module
			// that performs the sending of the email.
			var finalMailInput = {
				from    : "LSMSA SGO Website <sgo@lsmsa.edu>",
				to      : mailInput.to,
				subject : mailInput.subject,
				text    : results.text,
				html    : results.html
			}

			// Finally send the actual email to the recipient
			transporter.sendMail(finalMailInput, function(err, info) {

				if (err) {
					console.log("\n\nTransporter Error\n\n" + err + "\n\n")
				}
				else {
					console.log("Message Sent: " + info.response)
				}

			})

		} // End of if (err) { } else { }

	}) // End of template.render(...)

}