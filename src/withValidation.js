import React from "react";
import PropTypes from "prop-types";
import FormValidator from "./FormValidator";
import { bindInputValue } from "./form-utils";
import { observer } from "mobx-react";

/**
 * Higher order Component (HoC) that adds validation logic to
 * a form field, such as an Input element, textarea etc.
 *
 * Example usage of component wrapped with validation:
 *
 * ```
 * <Input
 * 	validator={validator}
 *  validate="required|phone"
 * />
 * ```
 *
 * ```
 * <Input
 * 	validator={validator}
 *  validate={{
 * 			method: (val) => Number(val) > 100,
 * 			validWhen: true,
 * 			message: "Value must be at least 100"
 * 	}}
 * />
 * ```
 *
 * ```
 * <Input
 * 	validator={validator}
 *  validate={[
 * 		"required",
 * 		{
 * 			method: (val) => Number(val) > 100,
 * 			validWhen: true,
 * 			message: "Value must be at least 100"
 * 		}
 * 	]}
 * />
 * ```
 *
 * ```
 * <Input
 * 	validator={validator}
 *  validate={(val) => Number(val) > 100}
 *  validationMessage="Value must be at least 100"
 * />
 * ```
 *
 * @param {Object} ComposedComponent
 */
function withValidation(ComposedComponent) {
	@observer
	class ComponentWithValidation extends React.Component {
		static propTypes = {
			// Validation rule, supports following formats:
			// `required` (String)
			// `required|phone` (String)
			// `["required", "phone"]` (Array<String>)
			// `(val) => val.length > 100` (Function)
			// `{method: "isEmpty", message: "Foo"}` (Object)
			validate: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.func, PropTypes.object]),
			// The FormValidator instance
			validator: PropTypes.instanceOf(FormValidator),
			// Optional custom message of validation, will override any
			// message already set
			validationMessage: PropTypes.string,
			// Name of field
			name: PropTypes.string.isRequired,
			// Which event(s) to validate on,  only "blur" and "change" is supported
			validateOn: PropTypes.oneOfType([PropTypes.string, PropTypes.array])
		};

		/**
		 * Form validator instance
		 * @type {FormValidator}
		 */
		validator = this.props.validator;

		validateOn = this.parseArray(this.props.validateOn || "blur");

		componentDidMount() {
			const { validate, validationMessage, value, name } = this.props;

			if (this.validator && validate) {
				this.registerValidationRules(validate, validationMessage);

				if (value !== undefined) {
					this.validator.setFieldValue(name, value);
				}
			}
		}

		componentDidUpdate() {
			const { value, name } = this.props;

			if (this.validator && value !== undefined) {
				this.validator.setFieldValue(name, value);
			}
		}

		/**
		 * Registers provided validation rules to validator.
		 */
		registerValidationRules(validate, customValidationMessage) {
			const { name } = this.props;

			validate = this.parseArray(validate);

			this.validator.registerFieldValidations(
				validate.map(rule => {
					const isFunction = typeof rule === "function";
					const isString = typeof rule === "string";

					if (isString) {
						if (!this.validator.formRules[rule]) {
							throw new Error("Missing validation rule '" + rule + "'");
						}
						rule = this.validator.formRules[rule];
					} else if (isFunction) {
						rule = { method: rule };
					}

					return { ...rule, message: customValidationMessage || rule.message, field: name };
				})
			);
		}

		handleBlur = e => {
			if (this.validateOn.includes("blur") && this.validator) {
				const fieldState = bindInputValue(e, {});
				this.validator.validate(fieldState);
			}

			this.props.onBlur && this.props.onBlur(e);
		};

		handleChange = e => {
			if (this.validateOn.includes("change") && this.validator) {
				const fieldState = bindInputValue(e, {});
				this.validator.validate(fieldState);
			}

			this.props.onChange && this.props.onChange(e);
		};

		render() {
			const { name, validateOn, validate, validator, ...rest } = this.props;
			const validationResult =
				this.validator && this.validator.validationResult && this.validator.validationResult[name];
			const isInvalid = validationResult && validationResult.isInvalid;
			const validationMessage = validationResult && validationResult.message;

			return (
				<ComposedComponent
					{...rest}
					onChange={this.handleChange}
					onBlur={this.handleBlur}
					validationResult={validationResult}
					isInvalid={isInvalid}
					validationMessage={validationMessage}
					name={name}
				/>
			);
		}

		/**
		 * Will align all of this to an array:
		 *
		 * foo -> ["foo"]
		 * foo|bar -> ["foo", "bar"]
		 * ["foo"] -> ["foo"]
		 *
		 * @param {String|Array} value
		 */
		parseArray(value) {
			if (Array.isArray(value)) {
				return value;
			}
			if (typeof value === "string") {
				return value.split("|");
			}
			return [value];
		}
	}

	return ComponentWithValidation;
}

export default withValidation;
