module.exports = function () {
	var module = { };

	console.log("here");

	module.isAdmin = function(req) {

		var email = req.user.email.toLowerCase()

		if (email === "elilangley@student.lsmsa.edu"  ||
			email === "connorelsea@student.lsmsa.edu" ||
			email === "jallen@lsmsa.edu" ||
			email === "sgo@lsmsa.edu") {
			return true
		}
		else {
			return false
		}

	}

	return module;
}