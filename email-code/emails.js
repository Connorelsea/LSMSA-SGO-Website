var EmailTemplate = require("email-templates").EmailTemplate,
    path      = require("path")

module.exports = {
	
	var sendEmail = function(templateName, templateData, mailOptions)
	{
		var templatedir = path.join(__dirname, "emails", templateName)
		var template    = new EmailTemplate(templatedir)
	}

}