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
			name: PropTypes.string.isRequired
		};

		validateOn = this.parseArray(this.props.validateOn || "blur");

		componentDidMount() {
			const { validator, validate, validationMessage } = this.props;

			if (validator && validate) {
				this.registerValidationRules(validate, validationMessage);
			}
		}

		componentDidUpdate() {
			const { validator, value, name } = this.props;

			if (validator && value !== undefined) {
				validator.setFieldValue(name, value);
			}
		}

		/**
		 * Registers provided validation rules to validator.
		 */
		registerValidationRules(validate, customValidationMessage) {
			validate = this.parseArray(validate);

			this.props.validator.registerValidationRules(
				validate.map(rule => {
					const isFunction = typeof rule === "function";
					const isString = typeof rule === "string";

					if (isString || isFunction) {
						rule = { method: rule };
					}

					if (rule.validWhen === undefined) {
						rule.validWhen = true;
					}

					return { ...rule, message: customValidationMessage || rule.message, field: this.props.name };
				}),
				this
			);
		}

		handleBlur = e => {
			if (this.validateOn.includes("blur") && this.props.validator) {
				const fieldState = bindInputValue(e, {});
				this.props.validator.validate(fieldState);
			}
		};

		handleChange = e => {
			if (this.validateOn.includes("change") && this.props.validator) {
				const fieldState = bindInputValue(e, {});
				this.props.validator.validate(fieldState);
			}

			this.props.onChange && this.props.onChange(e);
		};

		render() {
			const { validator, name, validateOn, validate, ...rest } = this.props;
			const validationResult = validator && validator.validationResult && validator.validationResult[name];
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
