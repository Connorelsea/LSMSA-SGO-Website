var Promise = require("bluebird")

/*
 * Function: Send General Email
 *
 * This is a generalized function to send a  site email
 * which includes containers of information and inserts
 * the most recent issues to bring to the user's attention.
 * 
 * containers : [ { title, body } ]
 * users      : [ { user, subject } ]
 */
exports.sendEmail = function(containers, users, connection) {

	var util = require("./issueFunctions")

	// Query three of the most recent issues from the
	// database by ordering by ID.
	util.getIssues("ORDER BY E.id DESC LIMIT 3", connection)

	// Build the results into usable issue objects.
	.then(util.buildIssues)

	// Send an email with the specified containers of
	// information to the specified users.
	.then(function(issues) {

		sendRawEmail = require("./emailer").sendRawEmail

		// Each user specified in the array will have
		// the same email send to them. Since the user
		// object is being passed in as well, the content
		// of the email can change based on user.
		users.forEach(function(user_object) {

			sendRawEmail("email-welcome", {
				containers : containers,
				user       : user_object.user,
				issues     : issues
			}, {
				to      : user_object.user.email,
				subject : user_object.subject
			})

		})

	})

	// if there is an error in any of these actions,
	// do this event and handle the error.
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

			// Assume Gmail transport since  the email
			// in this application will always be sent
			// from a Gmail based email account.
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