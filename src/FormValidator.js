import validator from "validator";
import { bindValue } from "./form-utils";
import { observable, action } from "mobx";
import objectPath from "object-path";

/**
 * Helper component to validate form inputs
 *
 * See https://github.com/mikeries/react-validation-tutorial for background.
 */
export default class FormValidator {
	/**
	 * Array containing global rules that will be available for all forms across all form
	 * validator instances.
	 */
	static globalRules = {};

	/**
	 * Registers global rules which will be available for all
	 */
	static registerGlobalRules = (rules = []) => {
		rules.forEach(rule => {
			FormValidator.globalRules[rule.name] = rule;
		});
	};

	/**
	 * Clears all global rules.
	 */
	static clearGlobalRules = () => {
		FormValidator.globalRules = {};
	};

	/**
	 * Array containing validation rules that are available to use for this
	 * validator instance. Will override any existing rule that already exist
	 * amongs global validation rules.
	 */
	formRules = { ...FormValidator.globalRules };

	/**
	 * Array containing all declared validations mapped to fields.
	 * @type {Array<Object>}
	 */
	fieldValidations = [];

	/**
	 * A copy of form state that will track values set in each fields
	 * value prop.
	 */
	cachedFormState = {};

	@observable
	validationResult = null;

	/**
	 *
	 * @param {Array<Object>} validationRules form validation rules
	 * @param {Object} opts
	 * @param {Boolean} opts.convertNumberToString if to convert field values that are numbers to string before validation
	 * @param {String} opts.defaultMessage default error message
	 */
	constructor(validationRules = [], { convertNumberToString = true, defaultMessage = "Invalid" } = {}) {
		this.registerFormRules(validationRules);
		this.convertNumberToString = convertNumberToString;
		this.defaultMessage = defaultMessage;
	}

	/**
	 * Validates provided form state agains registered validation rules.
	 *
	 * @param {Object} formStateFragment
	 */
	@action
	validate(formStateFragment) {
		this.cachedFormState = { ...this.cachedFormState, ...formStateFragment };

		let validation = this.validationResult || this.valid();

		// Track fields that has been marked invalid in this validation attempt
		// so we have a way of knowing when not to continue validation
		const invalidFieldsInValidationAttempt = {};

		this.fieldValidations.forEach(rule => {
			let fieldValue = this.getPropertyByPath(formStateFragment, rule.field);

			if (!invalidFieldsInValidationAttempt[rule.field] && fieldValue !== undefined) {
				fieldValue =
					typeof fieldValue === "number" && this.convertNumberToString ? fieldValue + "" : fieldValue;

				const validationMethod = this.getValidationFunction(rule);
				const args = rule.args || [];
				const isEmpty = this.isEmpty(fieldValue);
				const skip = isEmpty && rule.skipIfEmpty;

				if (!skip && validationMethod(fieldValue, ...args, this.cachedFormState) !== rule.validWhen) {
					const fieldValidationResult = {
						isInvalid: true,
						message: rule.message || this.defaultMessage,
						groupId: rule.groupId
					};
					validation[rule.field] = fieldValidationResult;
					invalidFieldsInValidationAttempt[rule.field] = true;
				} else {
					validation[rule.field] = { isInvalid: false, message: "" };

					if (rule.groupId) {
						Object.keys(validation).forEach(k => {
							if (rule.groupId === validation[k].groupId) {
								validation[k] = { isInvalid: false, message: "" };
							}
						});
					}
				}
			}
		});

		// Check if at least one validation failure exists, if so fail validation
		validation.isValid = !Object.keys(validation).some(key => validation[key].isInvalid);

		this.validationResult = validation;

		return validation;
	}

	valid() {
		const validation = {};
		this.fieldValidations.forEach(rule => (validation[rule.field] = { isInvalid: false, message: "" }));
		return { isValid: true, ...validation };
	}

	/**
	 * Registers form validation rules available to use in this form validator instance.
	 * @param {Array} rules
	 */
	registerFormRules(rules) {
		rules.forEach(rule => {
			if (!rule.name) {
				throw new Error("Missing validation rule name for: " + JSON.stringify(rule || {}));
			}

			this.formRules[rule.name] = rule;
		});
		return this;
	}

	/**
	 * Registers field validations.
	 *
	 * Each field validation contains the following:
	 *
	 * - A `field` attribute which identifies which form field this validation is for
	 * - An option `name` attribute which is the name of the vadation rule that exists in global or form registry
	 * - It may optionally contain the validation rule directly here, in that case `name` should not be set
	 *
	 * @param {Array} fieldValidations
	 */
	registerFieldValidations(fieldValidations) {
		fieldValidations.forEach(rule => {
			const { name, field, method, message, args = [], validWhen = true, skipIfEmpty = true, groupId } = rule;

			if (!name && !field) {
				throw new Error("Either 'name' or 'field' must be set on validation rule");
			}

			const isAlreadyRegistered =
				name &&
				this.fieldValidations.some(validation => validation.field === field && validation.name === name);

			if (!isAlreadyRegistered) {
				const validationSpec = { ...this.formRules[name] };

				const fieldValidation = {
					field,
					groupId,
					name,
					message: message || validationSpec.message,
					method: validationSpec.method || method,
					args: validationSpec.args || args,
					validWhen: validationSpec.validWhen !== undefined ? validationSpec.validWhen : validWhen,
					skipIfEmpty: validationSpec.skipIfEmpty !== undefined ? validationSpec.skipIfEmpty : skipIfEmpty
				};

				this.fieldValidations.push(fieldValidation);
			}
		});
		return this;
	}

	getPropertyByPath(obj, path) {
		try {
			return objectPath.get(obj, path);
		} catch (err) {
			// do nothing - this happens if parent prop does not exist, which means that value is undefined
		}
	}

	isEmpty(value) {
		const type = typeof value;
		if (type === "string") return value === "";
		else if (Array.isArray(value)) return value.length === 0;
		else if (type === "object") return value === {};
		else return !!value;
	}

	setFieldValue(name, value) {
		this.cachedFormState = bindValue(name, value, this.cachedFormState);
		return this;
	}

	getValidationFunction(rule) {
		// TODO: Method vs function, the semantic is kind of mixed - should align this
		const method = typeof rule.method === "function" ? rule.method : validator[rule.method];

		if (!method) {
			throw new Error("Invalid/missing validation method '" + rule.method + "' for field '" + rule.field + "'");
		}

		return method;
	}
}
