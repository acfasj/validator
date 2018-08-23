const Validator = require('../dist/validator')

const validator = new Validator()

const schema = {
  a: 'number',
  b: [
    { type: 'string', message: '要是字符串' },
    { min: 5, message: '最少5个字符' }
  ]
}

const data = {
  b: 'val'
}

const errors = validator.validate(data, schema)

console.log(errors)
