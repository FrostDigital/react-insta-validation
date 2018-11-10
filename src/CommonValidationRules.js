const commonValidationRules = {
	required: {
		method: "isEmpty",
		validWhen: false,
		message: "Fältet är obligatoriskt",
		allowEmpty: false
	},
	email: {
		method: "isEmail",
		validWhen: true,
		message: "Ogiltig e-postadress"
	},
	phone: {
		method: "matches",
		args: [/^(\+\d{1,3}[- ]?)?\d{10}$|^$/],
		validWhen: true,
		message: "Måste ha formatet 07XXXXXXXX"
	},
	orgNo: {
		method: "matches",
		validWhen: true,
		args: [/^[0-9]+(-[0-9]+)+$/],
		message: "Ange organisationsnummer, ex 554433-2211"
	},
	personalNumber: {
		method: "matches",
		validWhen: true,
		args: [
			/^(19|20)[0-9]{2}((0[1-9])|10|11|12)(01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31)[-][0-9]{4}$/
		],
		message: "Ange ett giltigt personnummer, ex 19901010-1122"
	},
	zipCode: {
		method: "matches",
		validWhen: true,
		args: [/^\d{3}\s?\d{2}$/],
		message: "Ange ett giltigt postnummer, ex 123 45"
	},
	number: {
		method: "isInt",
		validWhen: true,
		message: "Ange endast siffror"
	},
	numberWithSpace: {
		method: "matches",
		validWhen: true,
		args: [/^[\d\s]+$/],
		message: "Ange endast siffror"
	},
	"yyyy-mm-dd": {
		method: "matches",
		validWhen: true,
		args: [
			/^(19|20)[0-9]{2}-((0[1-9])|10|11|12)-(01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31)+$/
		],
		message: "Ange datum på formatet ÅÅÅÅ-MM-DD"
	},
	password: {
		method: "matches",
		validWhen: true,
		args: [/[0-9a-zA-Z]{6,}/],
		message: "Lösenordet ska innehålla minst 6 tecken"
	}
};

export default commonValidationRules;
