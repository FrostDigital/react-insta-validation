import * as React from "react";

interface FormValidatorOptions {
	convertNumberToString?: Boolean;
	defaultMessage?: String;
}

interface GlobalValidationRule extends ValidationRule {
	/**
	 * Name of validation rule. Name is used as identifier to reference to this rule.
	 */
	name: String;
}

interface ValidationRule {
	/**
	 * Name of validation rule. Name is used as identifier to reference to this rule.
	 */
	name?: String;

	/**
	 * Field name, i.e. 'name' prop of an input element.
	 */
	field?: String;

	/**
	 * Group id of field. Is used when declaring validation rule that spans
	 * over multiple fields.
	 */
	groupId?: String;

	/**
	 * Validation message. Will fallback to form validator instance default message
	 * if none is set.
	 */
	message?: String;

	/**
	 * Validator method/function. Acceps string and will then resolve it to name
	 * of validator function that exists in validator.js package.
	 */
	method: String | Function;

	/**
	 * Args that will be passed when invoking validator method.
	 */
	args?: Array<any>;

	/**
	 * Decides if rule is valid if validator method returns true or false.
	 * @default true
	 */
	validWhen?: Boolean;

	/**
	 * If to skip validation for this rule when field value is empty.
	 * @default true
	 */
	skipIfEmpty?: Boolean;
}

interface FormValidator {
	/**
	 * Registers global rules which will be available for all
	 * instances of form validators.
	 */
	static registerGlobalRules(rules: Array<GlobalValidationRule>);

	/**
	 * Empties all global rules.
	 */
	static clearGlobalRules();

	/**
	 * Creates new form validator instance with optional form validation
	 * rules and options.
	 */
	new (validationRules?: Array<ValidationRule>, opts?: FormValidatorOptions);

	/**
	 * Validates provided form state agains registered validation rules.
	 *
	 * @param {Object} formState
	 */
	validate(formState: any);
}

interface BindValue {
	(path: String, value: any, targetObj: Object);
}

interface BindInputValue {
	(event: Object, formState: any);
}

export const FormValidator: FormValidator;

export const bindInputValue: BindInputValue;

export const bindValue: BindValue;

export const withValidation: Function;
