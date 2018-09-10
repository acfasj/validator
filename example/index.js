const Validator = require('../dist/validator')

const validator = new Validator()

const schema = {
  test: {
    someCheck: val => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject('示例错误原因')
        }, 10)
      })
    }
  }
}

;(async () => {
  const data = { test: 'value' }
  const errors = await validator.validate(data, schema)

  console.log(errors, '错误')
})()
