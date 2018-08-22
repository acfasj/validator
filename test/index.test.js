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
    it('required === true should ok', () => {
      const schema = { test: { required: true } }
      const data = { test: '' }
      const errors = validator.validate(data, schema)
      assert(errors.length === 1)
      assert(errors[0].key === 'test')
      assert(errors[0].rule === 'required')
    })

    it('required === false should ok', () => {
      const schema = { test: { required: false } }
      const data = {}
      const errors = validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('required === undefined should ok', () => {
      const schema = { test: {} }
      const data = { test: 'value' }
      const errors = validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('type', () => {
    describe('type string', () => {
      it('type string should ok', () => {
        const schema = { test: { type: 'string' } }
        const data = { test: '' }
        const errors = validator.validate(data, schema)
        assert(errors === undefined)
      })

      it('input number should error', () => {
        const schema = { test: { type: 'string' } }
        const data = { test: 233 }
        const errors = validator.validate(data, schema)
        assert(errors.length === 1)
        assert(errors[0].key === 'test')
        assert(errors[0].rule === 'type')
      })
    })
  })

  describe('min', () => {
    it('should check string min error', () => {
      const schema = { test: { type: 'string', min: 3 } }
      const data = { test: '22' }
      const errors = validator.validate(data, schema)
      assert(errors.length === 1)
      assert(errors[0].key === 'test')
      assert(errors[0].rule === 'min')
    })

    it('should check number min error', () => {
      const schema = { test: { type: 'number', min: 3 } }
      const data = { test: 2 }
      const errors = validator.validate(data, schema)
      assert(errors.length === 1)
      assert(errors[0].key === 'test')
      assert(errors[0].rule === 'min')
    })
  })

  describe('max', () => {
    it('should check string max error', () => {
      const schema = { test: { type: 'string', max: 3 } }
      const data = { test: '4444' }
      const errors = validator.validate(data, schema)
      assert(errors.length === 1)
      assert(errors[0].key === 'test')
      assert(errors[0].rule === 'max')
    })

    it('should check number min error', () => {
      const schema = { test: { type: 'number', max: 3 } }
      const data = { test: 4 }
      const errors = validator.validate(data, schema)
      assert(errors.length === 1)
      assert(errors[0].key === 'test')
      assert(errors[0].rule === 'max')
    })
  })

  describe('match', () => {
    it('should match pattern ok', () => {
      const schema = { test: { match: /BLIND_TOM/i } }
      const data = { test: 'blind_tom' }
      const errors = validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('custom', () => {
    it('should check custom error', () => {
      const schema = {
        test: { custom: val => val === 'VALUE_NOT_EXIST', message: 'BLIND_TOM' }
      }
      const data = { test: 'value' }
      const errors = validator.validate(data, schema)
      assert(errors.length === 1)
      assert(errors[0].key === 'test')
      assert(errors[0].rule === 'custom')
      assert(errors[0].message === 'BLIND_TOM')
    })
  })
})

describe('instance validator', () => {
  describe('#validate()', () => {
    it('should return error while rule not exist', () => {
      const schema = {
        test: { RULE_NOT_EXIST: 'VALUE_NOT_EXIST', message: 'RULE_NOT_EXIST' }
      }
      const data = { test: 'value' }
      try {
        validator.validate(data, schema)
      } catch (e) {
        assert(e.toString() === 'Error: 对应的规则不存在于RULE_MAP中')
      }
    })
  })
})

describe('class Validator', () => {
  describe('static #addRule()', () => {
    it('should work with a new rule', () => {
      Validator.addRule('myRule', (value, config, type) => {
        return value === 'MY_RULE' && config === true
      })
      const schema = { test: { myRule: true } }
      const data = { test: 'MY_RULE' }
      const errors = validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should work with a new rule via object notation', () => {
      Validator.addRule({
        myRule: (value, config, type) => {
          return value === 'MY_RULE' && config === true
        }
      })
      const schema = { test: { myRule: true } }
      const data = { test: 'MY_RULE' }
      const errors = validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should override an exist rule', () => {
      Validator.addRule('min', (value, config, type) => {
        return value === 'MIN' && config === 'MIN'
      })
      const schema = { test: { min: 'MIN' } }
      const data = { test: 'MIN' }
      const errors = validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('static #addType()', () => {
    it('should work with a new type', () => {
      Validator.addType('myType', value => {
        return value === 'MY_TYPE'
      })
      const schema = { test: { type: 'myType' } }
      const data = { test: 'MY_TYPE' }
      const errors = validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should work with a new type via object notation', () => {
      Validator.addType({
        myType(value) {
          return value === 'MY_TYPE'
        }
      })
      const schema = { test: { type: 'myType' } }
      const data = { test: 'MY_TYPE' }
      const errors = validator.validate(data, schema)
      assert(errors === undefined)
    })

    it('should override an exist type', () => {
      Validator.addType('string', value => {
        return value === 0
      })
      const schema = { test: { type: 'string' } }
      const data = { test: 0 }
      const errors = validator.validate(data, schema)
      assert(errors === undefined)
    })
  })

  describe('static #addMessage()', () => {
    it('should work with a new message', () => {
      Validator.addRule('myRule', (value, config, type) => {
        return value === 'MY_RULE'
      })
      Validator.addMessage('myRule', 'MY_MESSAGE')
      const schema = { test: { myRule: true } }
      const data = { test: 0 }
      const errors = validator.validate(data, schema)
      assert(errors.length === 1)
      assert(errors[0].message === 'MY_MESSAGE')
    })

    it('should work with a new message via object notation', () => {
      Validator.addRule('myRule', (value, config, type) => {
        return value === 'MY_RULE'
      })
      Validator.addMessage({ 'myRule': 'MY_MESSAGE' })
      const schema = { test: { myRule: true } }
      const data = { test: 0 }
      const errors = validator.validate(data, schema)
      assert(errors.length === 1)
      assert(errors[0].message === 'MY_MESSAGE')
    })

    it('should override an exist message', () => {
      Validator.addMessage({ type: { string: 'string type required' } })
      const schema = { test: { type: 'string' } }
      const data = { test: 0 }
      const errors = validator.validate(data, schema)
      assert(errors.length === 1)
      assert(errors[0].message === 'string type required')
    })
  })
})
