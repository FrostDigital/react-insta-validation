import { Component } from "react";
import validator from "validator";
import { bindValue } from "./form-utils";
import objectPath from "object-path";

const DEBUG = 0;

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
	 * A copy of form state
	 */
	formState = {};

	validationResult = null;

	formComponents = new Map();

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
	 * @param {Object} form
	 */
	validate(form) {
		const validation = this.validationResult || this.valid();
		const invalidFieldsInValidationAttempt = {};

		this.fieldValidations.forEach(rule => {
			let fieldValue = this.getPropertyByPath(form, rule.field);

			if (fieldValue !== undefined) {
				this.formState = bindValue(rule.field, fieldValue, this.formState);
			}

			if (!invalidFieldsInValidationAttempt[rule.field] && fieldValue !== undefined) {
				fieldValue =
					typeof fieldValue === "number" && this.convertNumberToString ? fieldValue + "" : fieldValue;

				const validationMethod = this.getValidationFunction(rule);
				const args = rule.args || [];
				const isEmpty = this.isEmpty(fieldValue);
				const skip = isEmpty && rule.skipIfEmpty;
				const group = this.getGroupSibblingValues(rule, this.formState);

				if (
					!skip &&
					validationMethod({ value: fieldValue, args, form: this.formState, group }) !== rule.validWhen
				) {
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

		this.reRenderForm();

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
	 * @param {Component=} component
	 */
	registerFieldValidations(fieldValidations, component) {
		if (component) {
			this.formComponents.set(component.props.name, component);
		}

		fieldValidations.forEach(rule => {
			this.log(
				`Registering field validation rule ${rule.name} for field ${rule.field} ${
					rule.groupId ? "(group " + rule.groupId + ")" : ""
				}`
			);

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

	/**
	 *
	 * @param {String} name of field, used as
	 * @param {*} value
	 */
	setFieldValue(name, value) {
		this.formState = bindValue(name, value, this.formState);
		return this;
	}

	getValidationFunction(rule) {
		// TODO: Method vs function, the semantic is kind of mixed - should align this
		const method =
			typeof rule.method === "function"
				? rule.method
				: ({ value, args }) => validator[rule.method](value, ...args);

		if (!method) {
			throw new Error("Invalid/missing validation method '" + rule.method + "' for field '" + rule.field + "'");
		}

		return method;
	}

	reRenderForm() {
		// TODO: Re-render only component affected by validation
		[...this.formComponents.values()].forEach(component => {
			component.forceUpdate();
		});
	}

	/**
	 * Unregisters component from validator.
	 * @param {Component} component
	 */
	unregisterComponent(component) {
		const fieldName = component.props.name;
		this.formComponents.delete(fieldName);

		if (this.fieldValidations) {
			this.fieldValidations = this.fieldValidations.filter(
				fieldValidation => fieldValidation.field !== fieldName
			);
		}

		if (this.validationResult) {
			delete this.validationResult[fieldName];
		}
	}

	getGroupSibblingValues(rule, form) {
		if (!rule.groupId) return {};

		const groupFieldValidations = this.fieldValidations.filter(
			fieldValidation => fieldValidation.groupId === rule.groupId
		);

		return groupFieldValidations.reduce((res, fieldValidation) => {
			const keys = fieldValidation.field.split(".");
			res[keys[keys.length - 1]] = this.getPropertyByPath(form, fieldValidation.field);
			return res;
		}, {});
	}

	log(msg) {
		if (DEBUG) {
			console.log(msg);
		}
	}
}
