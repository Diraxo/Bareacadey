module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  // settings: {react: {version: 18.2}},
  plugins: ["react-refresh"],
  rules: {
    //   semi: ["error", "always"]
    "no-unused-vars": "off",
    "react/prop-types": "off",
    "no-constant-condition": "off",
    "react-hooks/rules-of-hooks": "off",
    "no-empty": "off",
    "no-unsafe-optional-chaining": "off",
    
    "react/jsx-key": ["error", { "checkFragmentShorthand": true }],
    // "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "off",

    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
};