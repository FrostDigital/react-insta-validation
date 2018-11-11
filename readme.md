# React Insta Validation

> TODO: Readme is work in progress

Simple form validation that uses mobx observer/observable to (re)render on updates.

This library provides an Higher Order Component `withValidation` which can add validation to any
field like component, such as an input or select but also custom UI widgets as long as they honor the
contract by having `value` and `onChange` props.

## Getting started

```
npm i react-insta-validation --save
```

## Test

```
npm test
```

## Example usage

```javascript

// Register global rules which can be reused over multiple forms
FormValidator.registerGlobalRules([
	{
		// name of validation rule
		name: "required",
		// the validator.js's function, ! indicates that value is
		// valid when this function return false
		method: "!isEmpty",
		// will NOT skip validation if value is empty (default is true)
		skipIfEmpty: false
	}
]);


// Wrap input component in HoC withValidation to enable validation
const InputWithValidation = withValidation({validationMessage, ...props}) => {
	return (
		<input {...props} />
		// withValidation sets prop `validationMessage` if field is invalid
		{validationMessage && <div className="error">{validationMessage}</div>}
	);
});

class UserForm extends React.Component {
	// Create validator instance for this form
	validator = new FormValidator();

	state = {
		user: {
			name: "",
			address: {
				street: "",
				city: ""
			}
		}
	}

	render() {
		return (
			<form onSubmit={this.onSubmit}>
				<InputWithValidation
					name="name"
					onChange={this.onChange}
					validator={this.validator}
					validate="required"
				/>
			</form>
		);
	}

	onSubmit = (e) => {
		// TODO

	}

	onChange = (e) => {
		// Bind value to state, but use nifty util to bind to nested objects by input name
		this.setState({user: bindInputValue(e, this.state.user)});
	}
}
```

## TODOs

-   Example of async validation
