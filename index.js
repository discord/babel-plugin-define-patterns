"use strict"
let { getIdentifierKind, getIdentifierGrammar } = require("babel-identifiers")
let { parseExpression } = require("@babel/parser")

function matches(path, node) {
	if (Array.isArray(node)) {
		return (
			node.length === path.length &&
			node.every((child, index) => {
				return matches(path[index], child)
			})
		)
	}

	if (node.type === "Identifier") {
		if (getIdentifierKind(path) === "reference") {
			// only if doesn't have local binding
			let binding = path.scope.getBinding(node.name)
			if (binding != null) return
		}

		return path.isIdentifier({ name: node.name })
	}

	if (node.type === "NumericLiteral") {
		return path.isNumericLiteral({ value: node.value })
	}

	if (node.type === "BooleanLiteral") {
		return path.isBooleanLiteral({ value: node.value })
	}

	if (node.type === "StringLiteral") {
		return path.isStringLiteral({ value: node.value })
	}

	if (node.type === "NullLiteral") {
		return path.isNullLiteral()
	}

	if (node.type === "MemberExpression") {
		return (
			path.isMemberExpression() &&
			matches(path.get("object"), node.object) &&
			matches(path.get("property"), node.property) &&
			node.computed === path.node.computed
		)
	}

	if (node.type === "CallExpression") {
		return (
			path.isCallExpression() &&
			matches(path.get("callee"), node.callee) &&
			matches(path.get("arguments"), node.arguments)
		)
	}

	if (node.type === "UnaryExpression") {
		return (
			path.isUnaryExpression({
				operator: node.operator,
				prefix: node.prefix,
			}) && matches(path.get("argument"), node.argument)
		)
	}

	if (node.type === "BinaryExpression") {
		return (
			path.isBinaryExpression({
				operator: node.operator,
			}) &&
			matches(path.get("left"), node.left) &&
			matches(path.get("right"), node.right)
		)
	}

	// Hey there! If you want to support this node.type, you can add support for
	// it here. See https://github.com/discord/babel-pluin-define-patterns
	throw new Error(`Unexpected pattern: ${node.type}`)
}

function definePatternsPlugin(babel) {
	let t = babel.types

	// use `void 0` instead of `undefined` for safety
	let undefinedNode = t.unaryExpression("void", t.numericLiteral(0))

	function getReplacements(pluginOpts, hub) {
		let replacements = pluginOpts.replacements
		let parserOpts = hub.file && hub.file.opts && hub.file.opts.parserOpts

		if (!replacements) {
			throw new Error("Must provide replacements option")
		}

		return Object.keys(replacements).map((pattern) => {
			return {
				pattern: parseExpression(pattern, parserOpts),
				value: replacements[pattern],
			}
		})
	}

	function replacementToNode(value) {
		// simple values
		if (value === null) return t.nullLiteral()
		if (typeof value === "boolean") return t.booleanLiteral(value)
		if (typeof value === "number") return t.numericLiteral(value)
		if (typeof value === "string") return t.stringLiteral(value)
		if (typeof value === "undefined") return undefinedNode

		// arrays
		if (Array.isArray(value)) {
			return t.arrayExpression(
				value.map((val) => {
					return replacementToNode(val)
				}),
			)
		}

		// objects
		if (typeof value === "object") {
			return t.objectExpression(
				Object.keys(value).map((key) => {
					return t.objectProperty(
						t.identifier(key),
						replacementToNode(value[key]),
					)
				}),
			)
		}

		// Hey there! If you want to support this value type, you can add support
		// for it here. See https://github.com/discord/babel-pluin-define-patterns
		throw new Error("Unexpected replacement value")
	}

	return {
		name: "define-patterns",
		visitor: {
			Program(path) {
				let replacements = getReplacements(this.opts, path.hub)

				path.traverse({
					Expression(path) {
						// Only if matches pattern
						let replacement = replacements.find((replacement) => {
							return matches(path, replacement.pattern)
						})
						if (!replacement) return

						path.replaceWith(replacementToNode(replacement.value))
					},
				})
			},
		},
	}
}

module.exports = definePatternsPlugin
