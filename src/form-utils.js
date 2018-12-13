import objectPath from "object-path";

/**
 * Binds value for provided event target value to object.
 * This is useful when binding form values to a state object.
 *
 * Object path is set from target name and accepts nested paths.
 * If any intermediate object does not exist, it will be created.
 *
 * @param {Object} event
 * @param {Object} obj object to bind value to
 */
export const bindInputValue = ({ target }, obj) => {
	const value = target.type === "checkbox" ? target.checked : target.value;
	const name = target.name;

	return bindValue(name, value, obj);
};

/**
 * Binds value to field path on object and returns new, updated object.
 *
 * Example:
 *
 * Value: "1" and path "foo.bar" ->  `{ foo: { bar: 1 }}`.
 *
 * @param {String} path
 * @param {any} value
 * @param {Object|Array} target
 */
export const bindValue = (path, value, target) => {
	const newTarget = Array.isArray(target) ? [...target] : { ...target };
	objectPath.set(newTarget, path, value);
	return newTarget;
};
