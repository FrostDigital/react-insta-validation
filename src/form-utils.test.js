import { bindInputValue } from "./form-utils";

it("should bind input value to nested property", () => {
	const state = { foo: { baz: 1 } };
	const e = { target: { name: "foo.bar", value: "value" } };

	const res = bindInputValue(e, state);

	expect(res.foo.bar).toBe("value");
	expect(res.foo.baz).toBe(1);
});

it("should bind input value to nested property and create parent objects", () => {
	const state = {};
	const e = { target: { name: "foo.bar", value: "value" } };

	const res = bindInputValue(e, state);

	expect(res.foo.bar).toBe("value");
});
