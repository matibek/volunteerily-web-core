var util = require('../../util');
var _ = require('lodash');

var map = {

  /**
   * Makes sure something is provided
   */
  'required': function RequireValidator(definition, value) {
    if (_.has(definition, 'required') && (!definition.required)) {
      return true;
    }

    return (value !== undefined) && (value !== null) && (value !== '');
  },

  /**
   * Validates a value with a regex
   */
  'regex': function RegexValidator(definition, value) {
    //TODO: throw exception if the regex is invalid

    // not required
    if (!value) {
      return true;
    }

    return !!value.match(definition.regex);
  },

  /**
   * Makes sure the value isn't too long
   */
  'size': function SizeValidator(definition, value) {
    //TODO: throw an exception if the range is invalid

    if (!value) {
      return false;
    }

    return value.length >= definition.range[0] &&
      value.length <= definition.range[1];
  },

  /**
   * Makes sure the value isn't too long
   */
  'range': function RangeValidator(definition, value) {
    //TODO: throw an exception if the range is invalid

    if (!value) {
      return false;
    }

    return value >= definition.range[0] &&
      value <= definition.range[1];
  },

  /**
   * Makes sure the length is less or equal to a max
   */
  'max': function MaxValidator(definition, value) {
    //TODO: throw an exception if the max is invalid

    if (value === undefined) {
      return true;
    }

    return value.length <= definition.value;
  },

  /**
   * Makes sure a value equals another
   */
  'equal': function EqualValidator(definition, value) {
    return definition.equal === value;
  },

  /**
   * Number validation
   */
  'number': function NumberValidator(definition, value) {

    if (value === undefined || value === null) {
      return true;
    }

    try {
      var result = parseInt(value);

      if (isNaN(result) || value === undefined || value === null) {
        return false;
      }

      return true;
    }
    catch (err) {
      return false;
    }
  },

  /**
   * Creates a custom validator by calling the Function validator provided
   */
  'custom': function CustomValidator(definition, value) {
    return definition.validator.call(this, value);
  },
};

/**
 * Validates a field
 * @param {Object} validators A validator object in the form of
 * {
 *   range: {...}
 *   regex: {...}
 * }
 * @param {Object} value The value to test
 * @return {Object} The result messages in the same structure as
 * the validators
 * {
 *   range: 'Error message',
 *   reger: 'Error message 2',
 * }
 */
function validate(validators, value) {

  if (!validators) {
    return true;
  }

  var that = this;
  var result = _.reduce(
    validators,
    function(result, config, key) {

      if (!validate2(key, config, value, that)) {
        result[key] = config.message || key + ' failed';
      }

      return result;
    },
    {}
  );

  return result;
}

function validate2(validator, options, value, context) {
  if (!validator) {
    return true;
  }

  if (_.has(map, validator) === false) {
    logger.warning('Unknown validator: %s. Will be ignored.', validator);

    // not critical, so ignore the validation
    return true;
  }

  return map[validator].call(context, options, value);
}

module.exports = {
  validate: validate,
};
