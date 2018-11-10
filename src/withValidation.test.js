import React from "react";
import { mount } from "enzyme";
import FormValidator from "./FormValidator";
import withValidation from "./withValidation";

let validator;
let ComponentWithValidation;

beforeAll(() => {
	FormValidator.registerGlobalRules([
		{
			name: "required",
			method: "isEmpty",
			message: "Field is required",
			validWhen: false,
			skipIfEmpty: false
		}
	]);
});

afterAll(() => FormValidator.clearGlobalRules());

beforeEach(() => {
	validator = new FormValidator();

	ComponentWithValidation = withValidation(({ validationResult, isInvalid, validationMessage, ...props }) => {
		return <input {...props} />;
	});
});

it("should validate using function as validate prop", () => {
	const component = mountComponent({
		validate: val => val.length > 1,
		validationMessage: "Foo is invalid"
	});

	mockChangeAndBlur(component.find("input"), "foo");
	expect(validator.validationResult.isValid).toBeTruthy();

	mockChangeAndBlur(component.find("input"), "f");
	expect(validator.validationResult.isValid).toBeFalsy();
	expect(validator.validationResult.foo.message).toBe("Foo is invalid");
});

it("should fallback to default string if no message is provided", () => {
	const component = mountComponent({
		validate: () => false
	});

	mockChangeAndBlur(component.find("input"), "foo");
	expect(validator.validationResult.isValid).toBeFalsy();
	expect(validator.validationResult.foo.message).toBe("Invalid");
});

it("should validate using global validation rule", () => {
	const component = mountComponent({
		validate: "required"
	});

	mockChangeAndBlur(component.find("input"), "foo");
	expect(validator.validationResult.isValid).toBeTruthy();

	mockChangeAndBlur(component.find("input"), "");
	expect(validator.validationResult.isValid).toBeFalsy();
});

it("should validate using multiple rules", () => {
	const component = mountComponent({
		validate: [
			"required",
			{
				method: val => val.length < 4,
				message: "Value cannot be longer than 3 chars",
				skipIfEmpty: true
			}
		]
	});

	mockChangeAndBlur(component.find("input"), "foo");
	expect(validator.validationResult.isValid).toBeTruthy();

	mockChangeAndBlur(component.find("input"), "");
	expect(validator.validationResult.isValid).toBeFalsy();
	expect(validator.validationResult.foo.message).toBe(FormValidator.globalRules.required.message);

	mockChangeAndBlur(component.find("input"), "foobar");
	expect(validator.validationResult.isValid).toBeFalsy();
	expect(validator.validationResult.foo.message).toBe("Value cannot be longer than 3 chars");
});

it("should use custom message provided  using common validation rule required", () => {
	const customMessage = "Oh, snap! This is required";

	const component = mountComponent({
		validate: "required",
		validationMessage: customMessage
	});

	mockChangeAndBlur(component.find("input"), "");
	expect(validator.validationResult.foo.message).toBe(customMessage);
});

it("should trigger validation on change", () => {
	const component = mountComponent({
		validate: "required",
		validateOn: "change"
	});

	mockChange(component.find("input"), "");
	expect(validator.validationResult.foo.isInvalid).toBeTruthy();
});

it("should NOT trigger validation on change", () => {
	const component = mountComponent({
		validate: "required",
		validateOn: "blur"
	});

	mockChange(component.find("input"), "");
	expect(validator.validationResult).toBeFalsy();
});

function mountComponent(props) {
	return mount(
		<ComponentWithValidation value={""} onChange={() => {}} name="foo" validator={validator} {...props} />
	);
}

/**
 * Helper function to mock input change and blur on provided input.
 *
 * @param {Object} input
 * @param {String} value
 */
function mockChangeAndBlur(input, value) {
	const mockEvent = {
		target: {
			value,
			name: input.props().name
		},
		preventDefault: () => {}
	};

	input.simulate("change", mockEvent).simulate("blur", mockEvent);
}

/**
 * Helper function to mock input change on provided input.
 *
 * @param {Object} input
 * @param {String} value
 */
function mockChange(input, value) {
	const mockEvent = {
		target: {
			value,
			name: input.props().name
		},
		preventDefault: () => {}
	};

	input.simulate("change", mockEvent);
}
