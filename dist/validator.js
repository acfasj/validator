(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Validator = factory());
}(this, (function () { 'use strict';

  const types = {
    string(value) {
      return typeof value === 'string'
    },
    number(value) {
      return !isNaN(Number(value))
    }
  };

  var RULE_MAP = {
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

    // 实际上我在这里按照类型判断了, 那也是不纯粹了
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

    match(value, config, type) {
      const reg = new RegExp(config);
      return reg.test(value)
    },

    custom(value, config, type) {
      return config(value)
    }
  };

  /**
   * 主要在于, messsage对应不同情况下的rule, 会有多条
   */
  const messages = {
    required: '必填',
    type: {
      string: '必须是字符串',
      number: '必须是数字'
    },
    min: {
      string: config => `至少要${config}个字符`,
      number: config => `至少要大于${config}`
    },
    max: {
      string: config => `不能超过${config}个字符`,
      number: config => `不能大于${config}`
    },
    match: '正则匹配不通过',
    custom: '未通过校验'
  };

  function getMessage(rulename, type, ...config) {
    const target = messages[rulename];
    if (typeof target === 'string') {
      return target
    }

    if (typeof target === 'object') {
      const typeTarget = target[type];
      if (typeof typeTarget === 'function') {
        return typeTarget(...config)
      }
      return typeTarget
    }

    return 'unknown message'
  }

  /*
  const loginRule = {
    rules: {
      username: {
        type: 'email'
      },
      password: {
        required: true
      }
    },
    messages: {
      username: {
        required: '用户名必填.',
        email: '邮箱格式不正确'
      },
      password: {
        required: '请输入密码'
      }
    }
  }

  // 采用下面这种
  const loginRule = {
    username: [
      { required: true, message: '邮箱必填' }
      { type: 'email', message: '邮箱格式不正确' }
    ],
    password: [
      { required: true, message: '请输入密码' }
    ]
  }
  */

  function format(value) {
    if (Array.isArray(value)) {
      return value
    }
    if (typeof value === 'string') {
      return [{ type: value }]
    }
    if (typeof value === 'object') {
      return [value]
    }
    return []
  }

  class Validator {
    validate(data, schema) {
      const errors = [];

      for (let key in schema) {
        const rules = format(schema[key]);
        const value = data[key]

        // 一个字段对应的所有规则数组
        ;(function validateKey() {
          for (let rule of rules) {
            const defMessage = rule.message;
            delete rule.message;

            for (let rulename in rule) {
              let checker = RULE_MAP[rulename];
              if (!checker) {
                throw new Error('对应的规则不存在于RULE_MAP中')
              }
              checker = checker.bind(RULE_MAP);

              // const pass = checker(value, rule.type, rule[rulename])
              const pass = checker(value, rule[rulename], rule.type);
              if (!pass) {
                // 遇到第一个错误就直接返回
                const message =
                  defMessage || getMessage(rulename, rule.type, rule[rulename]);
                errors.push({
                  key,
                  message,
                  rule: rulename
                });
                return
              }
            }
          }
        })();
      }

      if (errors.length) {
        return errors
      }
    }
  }

  return Validator;

})));
