const assert = require('power-assert')
const Validator = require('../dist/validator')

const validator = new Validator()

describe('validator', () => {
  describe('method validate', () => {
    it('rule not exist should return error', () => {
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
