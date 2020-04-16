"use strict"
let test = require("ava")
let babel = require("@babel/core")
let fs = require("fs")
let path = require("path")
let plugin = require("./")

function fn(input, options) {
	return babel
		.transformSync(input, {
			plugins: [[plugin, options]],
			babelrc: false,
			configFile: false,
		})
		.code.trimRight()
}

function read(filepath) {
	return fs.readFileSync(path.join(__dirname, filepath), "utf8").trimRight()
}

test("transform", (t) => {
	let input = read("fixtures/input.txt")
	let expected = read("fixtures/output.txt")
	let options = {
		replacements: {
			"replaceWithTrue": true,
			"replaceWithFalse": false,
			"replaceWithNull": null,
			"replaceWithUndefined": undefined,
			"replaceWith42": 42,
			"replaceWithHelloWorld": "hello world",
			"replaceWithArray": [1, 2, 3],
			"replaceWithObject": { foo: 1, 2: "bar" },
			"replace.member.expression": "replaced member expression",
			"replaceCallExpression(a, b, c)": "replaced call expression",
			"typeof replaceTypeOf": "replaced typeof",
			"replace[computed].member.expression":
				"replaced computed member expression",
			"value instanceof replaceInstanceOf": "replaced instance of",
			"1 + 1": "replaced addition",
			"1 * 1": "replaced multiplication",
			"replaceStaticValues(true, 'hello', 42, null, undefined)":
				"replaced static values",
		},
	}
	t.is(fn(input, options), expected)
})
