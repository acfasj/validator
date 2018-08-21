export const types = {
  string(value) {
    return typeof value === 'string'
  },
  number(value) {
    return !isNaN(Number(value))
  }
}

export default {
  required(value, type, config) {
    // 用户指明 reuired = false
    if (config === false) {
      return true
    }
    if (type === 'array' && Array.isArray(value)) {
      return value.length > 0
    }
    return Boolean(value) && value !== 0
  },

  type(value, type) {
    return types[type] && types[type](value)
  },

  // 实际上我在这里按照类型判断了, 那也是不纯粹了
  min(value, type, config) {
    if (type === 'string') {
      return value.length > config
    }

    if (type === 'number') {
      return Number(value) > config
    }
  },

  max(value, type, config) {
    return !this.min(value, type, config)
  },

  match(value, type, config) {
    const reg = new RegExp(config)
    return reg.test(value)
  },

  custom(value, type, config) {
    return config(value)
  }
}
