# babel-plugin-define-patterns

> Create constants that replace various expressions at build-time

## Install

```sh
npm install --save-dev babel-plugin-define-patterns
```

## Usage

```js
// babel.config.json
{
  "plugins": [
    ["define-patterns", {
      "replacements": {
        "process.env.NODE_ENV": "production",
        "typeof window": "object",
        "__DEV__": true,
        "require('currentBuildNumber')": 42
      }
    }]
  ]
}
```

## Example

**Input:**

```js
process.env.NODE_ENV
```

**Options:**

```json
{
	"replacements": {
		"process.env.NODE_ENV": "development"
	}
}
```

**Output:**

```js
"development"
```

For more examples see [input.txt](./fixtures/input.txt) and
[output.txt](./fixtures/output.txt).
