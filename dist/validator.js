(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Validator = factory());
}(this, (function () { 'use strict';

  /**
   * 类似于 Object.assign
   * 但对于 target 中原有的 object 类型的属性值不会覆盖, 而是合并
   *
   * @param {Object} target
   * @param {Object} source
   */

  function merge(target, source) {
    for (let key in source) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = source[key];
      } else {
        merge(target[key], source[key]);
      }
    }
  }

  /**
   * 返回一个函数
   * 调用这个函数就是用 merge 来修改 baseObj 的值
   *
   * @param {Object} baseObj
   * @return {Function}
   */

  function createAddAPI(baseObj) {
    return function add(...args) {
      if (typeof args[0] === 'string') {
        args[0] = {
          [args[0]]: args[1]
        };
      }
      merge(baseObj, args[0]);
    }
  }

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
  };

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
      const reg = new RegExp(config);
      return reg.test(value)
    },

    custom(value, config, type) {
      return config(value)
    }
  };

  const addType = createAddAPI(types);
  const addRule = createAddAPI(rules);

  /**
   * rule 和 message 能否不因为 type 的缘故而再嵌套多一层 ?
   * 都是扁平化的结构, 一条 rule 就对应一条message不行吗 ?
   * 当然可以, 只是这样必定要多出很多条 rulename , 代码写起来是方便了, 但使用不方便
   *
   * 比如, min 只用来比较 number 数值的大小
   * 如果要不再嵌套, 那么 min 就不能再用于限制 string 的最小长度, 要另起一个名字比如 minlength
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
    pattern: '正则匹配不通过',
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

  const addMessage = createAddAPI(messages);

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
        const rules$$1 = format(schema[key]);
        const value = data[key]

        // 一个字段对应的所有规则数组
        ;(function validateKey() {
          for (let rule of rules$$1) {
            const defMessage = rule.message;
            delete rule.message;

            for (let rulename in rule) {
              let checker = rules[rulename];
              if (!checker) {
                throw new Error('对应的规则不存在于RULE_MAP中')
              }
              checker = checker.bind(rules);

              const pass = checker(value, rule[rulename], rule.type);
              if (!pass) {
                // 遇到第一个错误就直接返回
                const message =
                  defMessage || getMessage(rulename, rule.type, rule[rulename]);
                errors.push({
                  key,
                  value,
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

  /**
   * 修改 rules(RULE_MAP) 对象
   * 和 custom 这条规则又有什么区别呢?
   * 如果有要多次重复使用的自定义规则, 用 addRule 和下面的api定义
   * 否则直接使用 custom 就好了
   */

  Validator.addRule = addRule;

  /**
   * 修改 messages 对象
   */

  Validator.addMessage = addMessage;

  /**
   * 修改 types 对象
   */

  Validator.addType = addType;

  return Validator;

})));
