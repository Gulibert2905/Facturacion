module.exports = {
    env: {
      node: true,
      jest: true,
      es6: true
    },
    extends: ['eslint:recommended', 'plugin:jest/recommended'],
    parserOptions: {
      ecmaVersion: 2020
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error'
    }
  };