module.exports = {
  extends: 'standard',
  // add your custom rules here
  rules: {
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'space-before-function-paren': 0,
    'prefer-promise-reject-errors': 0
  },
  globals: {
    describe: true,
    it: true,
    beforeEach: true
  }
}
