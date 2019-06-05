import React from "react";
import PropTypes from "prop-types";
import FormValidator from "./FormValidator";

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
			validateOn: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
			// Optional validation group id
			validationGroup: PropTypes.string
		};

		/**
		 * Form validator instance
		 * @type {FormValidator}
		 */
		validator = this.props.validator;

		validateOn = this.parseArray(this.props.validateOn || "blur");

		componentDidMount() {
			const { validate, validationMessage, value, name, validationGroup } = this.props;

			if (this.validator && validate) {
				this.registerValidationRules(validate, validationMessage, validationGroup);

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
		componentWillUnmount() {
			if (this.validator) {
				this.validator.unregisterComponent(this);
			}
		}

		/**
		 * Registers provided validation rules to validator.
		 */
		registerValidationRules(validate, customValidationMessage, validationGroup) {
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

					return {
						...rule,
						message: customValidationMessage || rule.message,
						field: name,
						groupId: validationGroup || rule.groupId
					};
				}),
				this
			);
		}

		handleBlur = e => {
			if (this.validateOn.includes("blur") && this.validator) {
				this.validator.setInputValue(e).validate();
			}

			this.props.onBlur && this.props.onBlur(e);
		};

		handleChange = e => {
			if (this.validateOn.includes("change") && this.validator) {
				this.validator.setInputValue(e).validate();
			}

			this.props.onChange && this.props.onChange(e);
		};

		render() {
			const { name, validateOn, validate, validator, validationGroup, ...rest } = this.props;
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
