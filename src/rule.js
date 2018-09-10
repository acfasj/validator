import { createAddAPI } from './helper'

/**
 * 实际上, 最终要校验的值几乎都是 primitive 的, 绝大部分都是字符串
 * 如果要校验 object 套 object 的, 有意义吗 ? 不懂写, 不写
 */

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
    // Boolean([]) === 0
    if (Array.isArray(value)) {
      return false
    }
    return !isNaN(Number(value))
  },

  /**
   * 比如想发一个 id 数组到后端
   *
   * @param {Array} value
   */

  array(value) {
    return Array.isArray(value)
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
    if (type === 'number') {
      return Number(value) >= config
    } else {
      return value.length >= config
    }
  },

  max(value, config, type) {
    if (type === 'number') {
      return Number(value) <= config
    } else {
      return value.length <= config
    }
  },

  len(value, config, type) {
    if (type === 'number') {
      return String(value) === String(config)
    }
    return value.length === config
  },

  pattern(value, config, type) {
    const reg = new RegExp(config)
    return reg.test(value)
  }
}

const addType = createAddAPI(types)
const addRule = createAddAPI(rules)

export default rules
export { addType, addRule }
