module.exports = {
  "root": true,
  "env": {
    "browser": true,
    "node": true,
    "es2021": true,
    "mocha": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "13",
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "rules": {
    '@typescript-eslint/no-var-requires': 0,
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",  { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ]
  },
}
