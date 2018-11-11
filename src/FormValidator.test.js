import FormValidator from "./FormValidator";

/**
 * @type {FormValidator}
 */
let formValidator;

beforeEach(() => {
	FormValidator.clearGlobalRules();
	FormValidator.registerGlobalRules([
		{
			name: "required",
			method: "isEmpty",
			message: "Field is required",
			validWhen: false,
			skipIfEmpty: false
		},
		{
			name: "email",
			method: "isEmail",
			validWhen: true,
			message: "Ogiltig e-postadress"
		}
	]);
});

it("should validate form when invalid", () => {
	const validations = [
		{
			field: "username",
			method: "isEmpty",
			validWhen: false,
			message: "Ange ett användarnamn",
			skipIfEmpty: false
		}
	];

	formValidator = new FormValidator().registerFieldValidations(validations);

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

	formValidator = new FormValidator().registerFieldValidations(validations);

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

	formValidator = new FormValidator().registerFieldValidations(validations);

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
		skipIfEmpty: false
	};

	formValidator = new FormValidator().registerFieldValidations([validationRule]);

	expect(formValidator.fieldValidations[0]).toEqual(validationRule);
});

it("should not re-register same rule", () => {
	const validationRule = {
		field: "username",
		name: "required"
	};

	formValidator = new FormValidator()
		.registerFieldValidations([validationRule])
		.registerFieldValidations([validationRule]);

	expect(formValidator.fieldValidations.length).toBe(1);
});

it("should override with custom message", () => {
	const validations = [
		{
			name: "required",
			field: "username",
			message: "Custom message"
		}
	];

	formValidator = new FormValidator().registerFieldValidations(validations);

	const validationResult = formValidator.validate({ username: "" });

	expect(validationResult.isValid).toBeFalsy();
	expect(validationResult.username.isInvalid).toBeTruthy();
	expect(validationResult.username.message).toBe("Custom message");
});

it("should validate using a global validation rule (required)", () => {
	const validations = [
		{
			field: "username",
			name: "required"
		}
	];

	formValidator = new FormValidator().registerFieldValidations(validations);

	const validationResult = formValidator.validate({ username: "" });

	expect(validationResult.isValid).toBeFalsy();
	expect(validationResult.username.isInvalid).toBeTruthy();
	expect(validationResult.username.message).toBe(FormValidator.globalRules.required.message);
});

it("should first fail validation and then succeed ", () => {
	const validations = [
		{
			name: "required",
			field: "firstName"
		},
		{
			name: "required",
			field: "lastName"
		}
	];

	formValidator = new FormValidator().registerFieldValidations(validations);

	const firstValidationResult = formValidator.validate({ firstName: "", lastName: "" });
	expect(firstValidationResult.isValid).toBeFalsy();

	const secondValidationResult = formValidator.validate({ firstName: "alice" });
	expect(secondValidationResult.isValid).toBeFalsy();

	const thirdValidationResult = formValidator.validate({ firstName: "alice", lastName: "svensson" });
	expect(thirdValidationResult.isValid).toBeTruthy();
});

it("should not validate email when field is empty", () => {
	const validations = [
		{
			field: "email",
			name: "email"
		}
	];

	formValidator = new FormValidator().registerFieldValidations(validations);

	const validationResult = formValidator.validate({ email: "" });

	expect(validationResult.isValid).toBeTruthy();
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

	formValidator = new FormValidator().registerFieldValidations(validations);

	expect(formValidator.validate({ expertise: [] }).isValid).toBeTruthy();
	expect(formValidator.validate({ expertise: ["foo", "bar"] }).isValid).toBeTruthy();
	expect(formValidator.validate({ expertise: ["foo", "bar", "baz", "foz", "poop", "pie"] }).isValid).toBeFalsy();
});

it("should validate matching passwords", () => {
	const matchingPasswordsValidation = {
		method: (val, { password, confirmPassword }) => password && confirmPassword && password === confirmPassword,
		message: "Passwords does not match",
		groupId: "matchingPasswords",
		skipIfEmpty: false
	};

	const validations = [
		{
			...matchingPasswordsValidation,
			field: "password"
		},
		{
			...matchingPasswordsValidation,
			field: "confirmPassword"
		}
	];

	formValidator = new FormValidator().registerFieldValidations(validations);

	let validationRes;

	validationRes = formValidator.validate({ password: "Password123" });
	expect(validationRes.password.isInvalid).toBeTruthy();
	expect(validationRes.confirmPassword.isInvalid).toBeFalsy();

	validationRes = formValidator.validate({ confirmPassword: "Bassword321" });
	expect(validationRes.confirmPassword.isInvalid).toBeTruthy();

	validationRes = formValidator.validate({ confirmPassword: "Password123" });
	// 👇 this is the gist of it, password field should change when confirmPassword was updated
	expect(validationRes.password.isInvalid).toBeFalsy();
	expect(validationRes.confirmPassword.isInvalid).toBeFalsy();
});
