import validator from "validator";
import commonValidationRules from "./CommonValidationRules";
import { bindValue } from "./form-utils";
import { observable, action } from "mobx";

/**
 * Helper component to validate form inputs
 *
 * See https://github.com/mikeries/react-validation-tutorial for background.
 */
export default class FormValidator {
	validations = [];

	cachedFormState = {};

	@observable
	validationResult = null;

	/**
	 *
	 * @param {Array<Object>} validations
	 * @param {Object} opts
	 * @param {Boolean} opts.convertNumberToString if to convert field values that are number to string before validation
	 */
	constructor(validations = [], { convertNumberToString = true, defaultMessage = "Invalid" } = {}) {
		this.commonValidationRules = commonValidationRules;
		this.registerValidationRules(validations);
		this.convertNumberToString = convertNumberToString;
		this.defaultMessage = defaultMessage;
	}

	@action
	validate(formState) {
		formState = { ...this.cachedFormState, ...formState };

		this.cachedFormState = formState;

		let validation = this.validationResult || this.valid();

		// Track fields that has been marked invalid in this validation attempt
		// so we have a way of knowing when not to continue validation (since it already failed)
		const invalidFieldsInValidationAttempt = {};

		this.validations.forEach(rule => {
			let fieldValue = this.getPropertyByPath(formState, rule.field);

			if (!invalidFieldsInValidationAttempt[rule.field] && fieldValue !== undefined) {
				fieldValue =
					typeof fieldValue === "number" && this.convertNumberToString ? fieldValue + "" : fieldValue;

				const validationMethod = typeof rule.method === "function" ? rule.method : validator[rule.method];
				const args = rule.args || [];
				const isEmpty = this.isEmpty(fieldValue);
				const skip = isEmpty && rule.allowEmpty;

				if (!skip && validationMethod(fieldValue, ...args, formState) !== rule.validWhen) {
					validation[rule.field] = {
						isInvalid: true,
						message: rule.message || this.defaultMessage,
						id: rule.id
					};
					invalidFieldsInValidationAttempt[rule.field] = true;
				} else {
					validation[rule.field] = { isInvalid: false, message: "" };

					if (rule.id) {
						Object.keys(validation).forEach(k => {
							if (rule.id === validation[k].id) {
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
		this.validations.map(rule => (validation[rule.field] = { isInvalid: false, message: "" }));
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
			const { field, method, message, args = [], validWhen, allowEmpty = true, id } = rule;

			let existingRule = this.validations.find(
				validation => validation.field === field && validation.method === method
			);

			if (!existingRule) {
				const commonValidationRule = this.commonValidationRules[method] || {};

				this.validations.push({
					field,
					id,
					message: message || commonValidationRule.message,
					method: commonValidationRule.method || method,
					args: commonValidationRule.args || args,
					validWhen:
						commonValidationRule.validWhen !== undefined ? commonValidationRule.validWhen : validWhen,
					allowEmpty:
						commonValidationRule.allowEmpty !== undefined ? commonValidationRule.allowEmpty : allowEmpty
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
}
