var mainNavigation = [
	{
		name : "Home",
		link : "/",
		sub  : []
	},
	{
		name : "About",
		link : "/about",
		sub  : [
			{
				name : "About",
				link : "/about"
			},
			{
				name : "Members",
				link : "/members"
			},
			{
				name : "Constitution",
				link : "/constitution"
			}
		]
	},
	{
		name : "Issues",
		link : "/issues",
		sub  : [
			{
				name : "Issue Board",
				link : "/issues"
			},
			{
				name : "Submit an Issue",
				link : "/issues/submit"
			},
			{
				name : "My Issues",
				link : "/issues#"
			}
		]
	},
	{
		name : "News",
		link : "/news",
		sub  : []
	},
	{
		name : "Events",
		link : "/events",
		sub  : []
	},
	{
		name : "Login",
		link : "/login",
		sub  : []
	}
]

var error_loginFailed = "To access the extended functionality of this website, you must use your LSMSA email address. Please select or add your email address when logging in again."

module.exports = {
	mainNavigation    : mainNavigation,
	error_loginFailed : error_loginFailed
}