import { createAddAPI } from './helper'

const types = {
  string(value) {
    return typeof value === 'string'
  },

  /**
   * 只要能转换成 number
   *
   * @param {String|Number} value
   */
  number(value) {
    return !isNaN(Number(value))
  }
}

const rules = {
  required(value, config, type) {
    // 用户指明 reuired = false
    if (config === false) {
      return true
    }
    if (type === 'array' && Array.isArray(value)) {
      return value.length > 0
    }
    return Boolean(value) && value !== 0
  },

  type(value, config, type) {
    return types[type] && types[type](value)
  },

  min(value, config, type) {
    if (type === 'string') {
      return value.length > config
    }

    if (type === 'number') {
      return Number(value) > config
    }
  },

  max(value, config, type) {
    return !this.min(value, config, type)
  },

  pattern(value, config, type) {
    const reg = new RegExp(config)
    return reg.test(value)
  },

  custom(value, config, type) {
    return config(value)
  }
}

const addType = createAddAPI(types)
const addRule = createAddAPI(rules)

export default rules
export {
  addType,
  addRule
}
