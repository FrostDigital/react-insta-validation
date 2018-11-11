import validator from "validator";
import { bindValue } from "./form-utils";
import { observable, action } from "mobx";

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
	 * Array containing all declared validation rules for this validator instance
	 * @type {Array<Object>}
	 */
	validationRules = [];

	/**
	 * A copy of form state that will track values set in each fields
	 * value prop.
	 */
	cachedFormState = {};

	@observable
	validationResult = null;

	/**
	 *
	 * @param {Array<Object>} validationRules
	 * @param {Object} opts
	 * @param {Boolean} opts.convertNumberToString if to convert field values that are numbers to string before validation
	 * @param {String} opts.defaultMessage default error message
	 */
	constructor(validationRules = [], { convertNumberToString = true, defaultMessage = "Invalid" } = {}) {
		this.registerValidationRules(validationRules);
		this.convertNumberToString = convertNumberToString;
		this.defaultMessage = defaultMessage;
	}

	/**
	 * Validates provided form state agains registered validation rules.
	 *
	 * @param {Object} formState
	 */
	@action
	validate(formState) {
		formState = { ...this.cachedFormState, ...formState };

		this.cachedFormState = formState;

		let validation = this.validationResult || this.valid();

		// Track fields that has been marked invalid in this validation attempt
		// so we have a way of knowing when not to continue validation
		const invalidFieldsInValidationAttempt = {};

		this.validationRules.forEach(rule => {
			let fieldValue = this.getPropertyByPath(formState, rule.field);

			if (!invalidFieldsInValidationAttempt[rule.field] && fieldValue !== undefined) {
				fieldValue =
					typeof fieldValue === "number" && this.convertNumberToString ? fieldValue + "" : fieldValue;

				const validationMethod = this.getValidationFunction(rule);
				const args = rule.args || [];
				const isEmpty = this.isEmpty(fieldValue);
				const skip = isEmpty && rule.skipIfEmpty;

				if (!skip && validationMethod(fieldValue, ...args, formState) !== rule.validWhen) {
					validation[rule.field] = {
						isInvalid: true,
						message: rule.message || this.defaultMessage,
						groupId: rule.groupId
					};
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
		this.validationRules.forEach(rule => (validation[rule.field] = { isInvalid: false, message: "" }));
		return { isValid: true, ...validation };
	}

	/**
	 * Registers new validation rules.
	 *
	 * Will check if rule (field and method) already exits and it that
	 * case update the exiting rule.
	 *
	 * @param {Array} rules
	 */
	registerValidationRules(rules) {
		rules.forEach(rule => {
			const { name, field, method, message, args = [], validWhen = true, skipIfEmpty = true, groupId } = rule;

			if (!name && !field) {
				throw new Error("Either 'name' or 'field' must be set on validation rule");
			}

			const isAlreadyRegistered =
				name && this.validationRules.some(validation => validation.field === field && validation.name === name);

			if (!isAlreadyRegistered) {
				const globalRule = { ...(FormValidator.globalRules[name] || {}) };

				this.validationRules.push({
					field,
					groupId,
					name,
					message: message || globalRule.message,
					method: globalRule.method || method,
					args: globalRule.args || args,
					validWhen: globalRule.validWhen !== undefined ? globalRule.validWhen : validWhen,
					skipIfEmpty: globalRule.skipIfEmpty !== undefined ? globalRule.skipIfEmpty : skipIfEmpty
				});
			}
		});
	}

	getPropertyByPath(obj, path) {
		try {
			// eslint-disable-next-line
			return eval(`obj.${path};`); // TODO: A better way wo eval?
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
