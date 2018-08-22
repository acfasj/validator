const Validator = require('../dist/validator')

const validator = new Validator()

Validator.addRule('min', (value, config, type) => {
  // return value === 'min' && config === 'min'
  return true
})
const schema = { test: { min: 'min' } }
const data = { test: 'min' }
const errors = validator.validate(data, schema)
