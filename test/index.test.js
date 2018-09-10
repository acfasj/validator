const assert = require('power-assert')
const purgeCache = require('./purge-cache')
let Validator
let validator

/**
 * 清除 node 对 Validator 的缓存
 * 因为 addType, addRule, addMessage, 都会改变对应的对象
 * https://mochajs.org/#root-level-hooks
 */

beforeEach(() => {
  // before every test in every file
  purgeCache('../dist/validator')
  Validator = require('../dist/validator')
  validator = new Validator()
})

describe('all rules', () => {
  describe('required', () => {
    it('required === true should ok', async () => {
      const schema = { test: { required: true } }
      const data = { test: '' }
      const errors = await validator.validate(data, schema)
      assert.deepStrictEqual(errors, {
        test: { value: '', message: '必填', rule: 'required' }
      })
    })

    it('required === false should ok', async () => {
      const schema = { test: { required: false } }
      const data = {}
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('required === undefined should ok', async () => {
      const schema = { test: {} }
      const data = { test: 'value' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('type', () => {
    describe('type string', () => {
      it('should ok', async () => {
        const schema = { test: { type: 'string' } }
        const data = { test: '' }
        const errors = await validator.validate(data, schema)
        assert(errors === undefined)
      })

      it('should return error with a mismatch type array', async () => {
        const schema = { test: { type: 'string' } }
        const data = { test: [] }
        const errors = await validator.validate(data, schema)
        assert.deepStrictEqual(errors, {
          test: { value: [], message: '必须是字符串', rule: 'type' }
        })
      })
    })

    describe('type number', () => {
      it('should ok', async () => {
        const schema = { test: { type: 'number' } }
        const data = { test: 0 }
        const errors = await validator.validate(data, schema)
        assert(errors === undefined)
      })

      it('should return error with a mismatch type array', async () => {
        const schema = { test: { type: 'number' } }
        const data = { test: [] }
        const errors = await validator.validate(data, schema)
        assert.deepStrictEqual(errors, {
          test: { value: [], message: '必须是数字', rule: 'type' }
        })
      })
    })

    describe('type array', () => {
      it('should ok', async () => {
        const schema = { test: { type: 'array' } }
        const data = { test: [] }
        const errors = await validator.validate(data, schema)
        assert(errors === undefined)
      })

      it('should return error with a mismatch type number', async () => {
        const schema = { test: { type: 'array' } }
        const data = { test: 0 }
        const errors = await validator.validate(data, schema)
        assert.deepStrictEqual(errors, {
          test: { value: 0, message: '必须是数组', rule: 'type' }
        })
      })
    })
  })

  describe('min', () => {
    it('should ok with type string', async () => {
      const schema = { test: { type: 'string', min: 3 } }
      const data = { test: '333' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should ok with type number', async () => {
      const schema = { test: { type: 'number', min: 3 } }
      const data = { test: 3 }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should ok with type array', async () => {
      const schema = { test: { type: 'array', min: 3 } }
      const data = { test: [1, 2, 3] }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('max', () => {
    it('should ok with type number', async () => {
      const schema = { test: { type: 'number', max: 3 } }
      const data = { test: 3 }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should ok with type string', async () => {
      const schema = { test: { type: 'string', max: 3 } }
      const data = { test: '333' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should ok with type array', async () => {
      const schema = { test: { type: 'array', max: 3 } }
      const data = { test: [1, 2, 3] }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('len', () => {
    it("should equal to string's length with type string", async () => {
      const schema = { test: { type: 'string', len: 3 } }
      const data = { test: '333' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should equal to config with type number', async () => {
      const schema = { test: { type: 'number', len: 3 } }
      const data = { test: 3 }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it("should equal to array's length with type array", async () => {
      const schema = { test: { type: 'array', len: 3 } }
      const data = { test: [1, 2, 3] }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('pattern', () => {
    it('should match pattern ok', async () => {
      const schema = { test: { pattern: /BLIND_TOM/i } }
      const data = { test: 'blind_tom' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('fucntion', () => {
    it('should ok', async () => {
      const schema = {
        test: {
          someCheck: val => {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve()
              }, 10)
            })
          }
        }
      }
      const data = { test: 'value' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should return an instance of Promise while using funtion', async () => {
      const schema = {
        test: { custom: val => val === 'VALUE_NOT_EXIST', message: 'BLIND_TOM' }
      }
      const data = { test: 'value' }
      try {
        await validator.validate(data, schema)
      } catch (e) {
        assert(e.toString() === 'TypeError: 自定义校验函数必须返回一个Promise')
      }
    })

    it('should return errors while promise rejected', async () => {
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
      const data = { test: 'value' }
      const errors = await validator.validate(data, schema)
      assert.deepStrictEqual(errors, {
        test: {
          value: 'value',
          message: '示例错误原因',
          rule: 'someCheck'
        }
      })
    })

    it('should return the first rejection while mutiple promises returns', async () => {
      const schema = {
        test: {
          someCheck: val => {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                reject('示例错误原因')
              }, 100)
            })
          },
          sexyCheck: val => {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                reject(val)
              }, 10)
            })
          }
        }
      }
      const data = { test: 'wow' }
      const errors = await validator.validate(data, schema)
      assert.deepStrictEqual(errors, {
        test: {
          value: 'wow',
          message: 'wow',
          rule: 'sexyCheck'
        }
      })
    })
  })
})

describe('instance validator', () => {
  describe('#validate()', () => {
    it('should return error while rule not exist', async () => {
      const schema = {
        test: { RULE_NOT_EXIST: 'VALUE_NOT_EXIST', message: 'RULE_NOT_EXIST' }
      }
      const data = { test: 'value' }
      try {
        await validator.validate(data, schema)
      } catch (e) {
        assert(
          e.toString() ===
            'TypeError: 基本规则名不正确, 不存在于内置的RULE_MAP中, 请检查是否拼写错误'
        )
      }
    })

    it('should return equal results due to the same input in multiple validtations', async () => {
      const schema = { test: 'string' }
      const data = { test: 233 }
      const errors1 = await validator.validate(data, schema)
      const errors2 = await validator.validate(data, schema)
      assert.deepStrictEqual(errors1, errors2)
    })
  })
})

describe('class Validator', () => {
  describe('static #addRule()', () => {
    it('should work with a new rule', async () => {
      Validator.addRule('myRule', (value, config, type) => {
        return value === 'MY_RULE' && config === true
      })
      const schema = { test: { myRule: true } }
      const data = { test: 'MY_RULE' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should work with a new rule via object notation', async () => {
      Validator.addRule({
        myRule: (value, config, type) => {
          return value === 'MY_RULE' && config === true
        }
      })
      const schema = { test: { myRule: true } }
      const data = { test: 'MY_RULE' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should override an exist rule', async () => {
      Validator.addRule('min', (value, config, type) => {
        return value === 'MIN' && config === 'MIN'
      })
      const schema = { test: { min: 'MIN' } }
      const data = { test: 'MIN' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('static #addType()', () => {
    it('should work with a new type', async () => {
      Validator.addType('myType', value => {
        return value === 'MY_TYPE'
      })
      const schema = { test: { type: 'myType' } }
      const data = { test: 'MY_TYPE' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should work with a new type via object notation', async () => {
      Validator.addType({
        myType(value) {
          return value === 'MY_TYPE'
        }
      })
      const schema = { test: { type: 'myType' } }
      const data = { test: 'MY_TYPE' }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should override an exist type', async () => {
      Validator.addType('string', value => {
        return value === 0
      })
      const schema = { test: { type: 'string' } }
      const data = { test: 0 }
      const errors = await validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('static #addMessage()', () => {
    it('should work with a new message', async () => {
      Validator.addRule('myRule', (value, config, type) => {
        return value === 'MY_RULE'
      })
      Validator.addMessage('myRule', 'MY_MESSAGE')
      const schema = { test: { myRule: true } }
      const data = { test: 0 }
      const errors = await validator.validate(data, schema)
      assert(errors, {
        test: { value: 0, message: 'MY_MESSAGE', rule: 'myRule' }
      })
    })

    it('should work with a new message via object notation', async () => {
      Validator.addRule('myRule', (value, config, type) => {
        return value === 'MY_RULE'
      })
      Validator.addMessage({ myRule: 'MY_MESSAGE' })
      const schema = { test: { myRule: true } }
      const data = { test: 0 }
      const errors = await validator.validate(data, schema)
      assert(errors, {
        test: { value: 0, message: 'MY_MESSAGE', rule: 'myRule' }
      })
    })

    it('should override an exist message', async () => {
      Validator.addMessage({ type: { string: 'string type required' } })
      const schema = { test: { type: 'string' } }
      const data = { test: 0 }
      const errors = await validator.validate(data, schema)
      assert(errors, {
        test: { value: 0, message: 'string type required', rule: 'type' }
      })
    })
  })
})
