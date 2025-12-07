import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import pluginNext from "@next/eslint-plugin-next";
import configPrettier from "eslint-config-prettier";
import pluginImport from "eslint-plugin-import";
import pluginReact from "eslint-plugin-react";
import pluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import ts from "typescript-eslint";

const compat = new FlatCompat();

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	js.configs.recommended,
	...ts.configs.recommended,
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					ignoreRestSiblings: true,
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-empty-object-type": "off",
		},
	},
	configPrettier,
	pluginImport.flatConfigs.recommended,
	...compat.extends("plugin:import/typescript"),
	{
		settings: {
			"import/resolver": {
				typescript: true,
				node: true,
				alias: {
					map: [["@", "./src"]],
					extensions: [".js", ".jsx"],
				},
			},
		},
	},
	pluginUnicorn.configs["flat/recommended"],
	{
		rules: {
			"unicorn/prevent-abbreviations": "off",
			"unicorn/no-null": "off",
			"unicorn/no-nested-ternary": "off",
			"unicorn/no-array-reduce": "off",
			"unicorn/no-array-for-each": "warn",
			"unicorn/prefer-ternary": "warn",
			"unicorn/no-negated-condition": "warn",
			"unicorn/prefer-array-some": "warn",
			"unicorn/prefer-spread": "warn",
			"unicorn/prefer-global-this": "warn",
			"unicorn/prefer-number-properties": "warn",
			"unicorn/numeric-separators-style": "warn",
			"unicorn/prefer-at": "warn",
			"unicorn/explicit-length-check": "warn",
			"unicorn/switch-case-braces": "warn",
			"unicorn/prefer-string-replace-all": "warn",
			"unicorn/consistent-function-scoping": "warn",
			"unicorn/filename-case": "warn",
			"unicorn/prefer-optional-catch-binding": "warn",
			"unicorn/prefer-switch": "warn",
			"unicorn/no-useless-undefined": "warn",
			"unicorn/prefer-code-point": "warn",
			"react/no-unescaped-entities": "warn",
			"react-hooks/exhaustive-deps": "warn",
			"import/no-duplicates": "warn",
			"import/no-named-as-default": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
		},
	},
	pluginReact.configs.flat.recommended,
	{
		settings: {
			react: {
				version: "detect",
			},
		},
		rules: {
			"react/prop-types": "off",
		},
	},
	...compat.extends("plugin:react-hooks/recommended"),
	...compat.config(pluginNext.configs.recommended),
];
