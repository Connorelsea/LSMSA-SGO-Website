var mobileNavigation = [
	{ name : "Home", link : "/" },
	{ name : "About", link : "/about" },
	{ name : "Members", link : "/members", small : true },
	{ name : "Constitution", link : "/constitution", small : true },
	{ name : "Tech", link : "/technology" },
	{ name : "Issue Board", link : "/issues" },
	{ name : "Submit Issue", link : "/issues/submit" },
	{ name : "News", link : "/news" },
	{ name : "Food", link : "/food" }
]

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
			},
			{
				name : "Technology",
				link : "/technology"
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
			}
		]
	},
	{
		name : "News",
		link : "/news",
		sub  : []
	},
	{
		name : "Food",
		link : "/food",
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
	mobileNavigation  : mobileNavigation,
	mainNavigation    : mainNavigation,
	error_loginFailed : error_loginFailed
}