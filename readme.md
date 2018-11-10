# React Insta Validation

Simple form validation that uses mobx observer/observable to (re)render on updates.

This library provides an Higher Order Component `withValidation` which can add validation to any
"field like" component, such as an input or select.

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
// Wrap input component in HoC withValidation which in turn will hook into validation
// and
const InputWithValidation = withValidation({validationMessage, ...props}) => {
	return (
		<input {...props} />
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
		// TODO
	}
}
```
