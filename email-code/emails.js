var auth           = require("../config/auth")
var nodemailer     = require("nodemailer")
var EmailTemplate  = require("email-templates").EmailTemplate
var path           = require("path")

function sendEmail(templateName, templateInput, mailInput) {

	var template  = new EmailTemplate("./emails/" + templateName)
	console.log("TEMPLATE: " + JSON.stringify(template))

	template.render(templateInput, function(err, results) {

		if (err) {
			console.log("\n\nEmail Error\n\n" + err + "\n\n")
		}
		else {

			var transporter = nodemailer.createTransport({
				service : "Gmail",
				auth    : auth.mailer.auth
			})

			var finalMailInput = {
				from    : "SGO Website <sgo@lsmsa.edu>",
				to      : mailInput.to,
				subject : mailInput.subject,
				text    : results.text,
				html    : results.html
			}

			transporter.sendMail(finalMailInput, function(err, info) {

				if (err) {
					console.log("\n\nTransporter Error\n\n" + err + "\n\n")
				}
				else {
					console.log("Message Sent: " + info.response)
				}

			})

		}

	})

}

module.exports = sendEmail