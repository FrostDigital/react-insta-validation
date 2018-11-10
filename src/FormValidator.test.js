import FormValidator from "./FormValidator";

/**
 * @type {FormValidator}
 */
let formValidator;

it("should validate form when invalid", () => {
	const validations = [
		{
			field: "username",
			method: "isEmpty",
			validWhen: false,
			message: "Ange ett användarnamn",
			allowEmpty: false
		}
	];

	formValidator = new FormValidator(validations);

	const validationResult = formValidator.validate({ username: "" });

	expect(validationResult.isValid).toBeFalsy();
	expect(validationResult.username.isInvalid).toBeTruthy();
});

it("should validate form when valid", () => {
	const validations = [
		{
			field: "username",
			method: "isEmpty",
			validWhen: false,
			message: "Ange ett användarnamn"
		}
	];

	formValidator = new FormValidator(validations);

	const validationResult = formValidator.validate({ username: "foo@bar.se" });

	expect(validationResult.isValid).toBeTruthy();
	expect(validationResult.username.isInvalid).toBeFalsy();
});

it("should validate form with nested properties", () => {
	const validations = [
		{
			field: "company.name",
			method: "isEmpty",
			validWhen: false
		}
	];

	formValidator = new FormValidator(validations);

	const validationResult = formValidator.validate({ company: { name: "Name" } });

	expect(validationResult.isValid).toBeTruthy();
	expect(validationResult["company.name"].isInvalid).toBeFalsy();
});

it("should register validation rule", () => {
	const validationRule = {
		field: "username",
		method: "isEmpty",
		validWhen: false,
		message: "Ange ett användarnamn",
		args: [],
		allowEmpty: false
	};

	formValidator = new FormValidator();
	formValidator.registerValidationRules([validationRule]);

	expect(formValidator.validations[0]).toEqual(validationRule);
});

it("should not re-register same rule", () => {
	const validationRule = {
		field: "username",
		method: "isEmpty",
		validWhen: false,
		message: "Ange ett användarnamn",
		args: []
	};

	formValidator = new FormValidator([validationRule]);
	formValidator.registerValidationRules([{ ...validationRule }]);

	expect(formValidator.validations.length).toBe(1);
});

it("should override with custom message", () => {
	const validations = [
		{
			field: "username",
			method: "required",
			message: "Custom message"
		}
	];

	formValidator = new FormValidator(validations);

	const validationResult = formValidator.validate({ username: "" });

	expect(validationResult.isValid).toBeFalsy();
	expect(validationResult.username.isInvalid).toBeTruthy();
	expect(validationResult.username.message).toBe("Custom message");
});

it("should validate using a common validation rule (orgNo)", () => {
	const validations = [
		{
			field: "orgNo",
			method: "orgNo"
		}
	];

	formValidator = new FormValidator(validations);

	const validationResult = formValidator.validate({ orgNo: "234" });

	expect(validationResult.isValid).toBeFalsy();
	expect(validationResult.orgNo.isInvalid).toBeTruthy();
	expect(validationResult.orgNo.message).toBe(formValidator.commonValidationRules.orgNo.message);
});

it("should first fail validation and then succeed ", () => {
	const validations = [
		{
			method: "required",
			field: "firstName"
		},
		{
			method: "required",
			field: "lastName"
		}
	];

	formValidator = new FormValidator(validations);

	const firstValidationResult = formValidator.validate({ firstName: "", lastName: "" });
	expect(firstValidationResult.isValid).toBeFalsy();

	const secondValidationResult = formValidator.validate({ firstName: "alice" });
	expect(secondValidationResult.isValid).toBeFalsy();

	const thirdValidationResult = formValidator.validate({ firstName: "alice", lastName: "svensson" });
	expect(thirdValidationResult.isValid).toBeTruthy();
});

it("should not validate phone when field is empty", () => {
	const validations = [
		{
			field: "email",
			method: "email"
		}
	];

	formValidator = new FormValidator(validations);

	const validationResult = formValidator.validate({ email: "" });

	expect(validationResult.isValid).toBeTruthy();
});

it("should validate personal number", () => {
	const validations = [
		{
			field: "personalNumber",
			method: "personalNumber"
		}
	];

	formValidator = new FormValidator(validations);

	const invalidPersonalNumbers = [
		// Dash/space syntax
		"199010101010",
		"19901010 1010",
		"19901010 - 1010",
		// Century out of bound
		"18901010-1010",
		"21901010-1010",
		// Month out of bound
		"19900010-1010",
		"19901310-1010",
		// Day out of bound
		"19901000-1010",
		"19901032-1010"
	];

	const validPersonalNumbers = ["19901010-1010", "20001010-1010", "20000110-1010", "20001210-1010"];

	invalidPersonalNumbers.forEach(personalNumber => {
		const isValid = formValidator.validate({ personalNumber }).isValid;

		if (isValid) {
			console.log("Personal number should be invalid: ", personalNumber);
		}

		expect(isValid).toBeFalsy();
	});

	validPersonalNumbers.forEach(personalNumber => {
		const isValid = formValidator.validate({ personalNumber }).isValid;

		if (!isValid) {
			console.log("Personal number should be valid: ", personalNumber);
		}

		expect(isValid).toBeTruthy();
	});
});

it("should validate yyyyMmDd", () => {
	const validations = [
		{
			field: "date",
			method: "yyyy-mm-dd"
		}
	];

	formValidator = new FormValidator(validations);

	const invalidDates = [
		// Invalid century
		"2100-01-01",
		"1800-01-01",
		// Month out of bounds
		"1900-00-01",
		"1900-13-01",
		// Day out of bounds
		"1900-01-00",
		"1900-01-32"
	];

	const validDates = ["1990-10-10", "2000-10-10"];

	invalidDates.forEach(date => {
		const isValid = formValidator.validate({ date }).isValid;

		if (isValid) {
			console.log("Date should be invalid: ", date);
		}

		expect(isValid).toBeFalsy();
	});

	validDates.forEach(date => {
		const isValid = formValidator.validate({ date }).isValid;

		if (!isValid) {
			console.log("Date should be valid: ", date);
		}

		expect(isValid).toBeTruthy();
	});
});

it("should validate using custom validation function", () => {
	const validations = [
		{
			field: "expertise",
			method: val => val.length > 0 && val.length < 6,
			message: "Ange 1-5 kompetenser",
			validWhen: true
		}
	];

	formValidator = new FormValidator(validations);

	expect(formValidator.validate({ expertise: [] }).isValid).toBeTruthy();
	expect(formValidator.validate({ expertise: ["foo", "bar"] }).isValid).toBeTruthy();
	expect(formValidator.validate({ expertise: ["foo", "bar", "baz", "foz", "poop", "pie"] }).isValid).toBeFalsy();
});

it("should validate with function that is based on multiple fields with initial value", () => {
	const validations = [
		{
			field: "foo",
			method: (val, formState) => !!(formState.foo && formState.bar),
			validWhen: true
		}
	];

	formValidator = new FormValidator(validations).setFieldValue("foo", 1);

	expect(formValidator.validate({ bar: 1 }).isValid).toBeTruthy();
	expect(formValidator.validate({ bar: 0 }).isValid).toBeFalsy();
	expect(formValidator.validate({ foo: 1, bar: 0 }).isValid).toBeFalsy();
	expect(formValidator.validate({ foo: 0, bar: 1 }).isValid).toBeFalsy();
	expect(formValidator.validate({ foo: 1 }).isValid).toBeTruthy();
});
