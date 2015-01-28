var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var util = require('../util');
var _ = require('lodash');

var types = {
  id: {
    default: '',
    sample: '54375fb4d9a395b4510285b6',
    db: mongoose.Schema.ObjectId, // TODO: too coupled
  },

  string: {
    default: '',
    sample: 'sample string',
    db: String,
  },

  number: {
    default: 0,
    sample: 999,
    db: Number,
  },

  bool: {
    default: false,
    sample: false,
    db: Boolean,
  },

  date: {
    default: null,
    sample: moment().add(1, 'days').startOf('hour').toDate(),
    db: Date,
  },

  mixed: {
    default: null,
    sample: { sample: true, },
    db: mongoose.Schema.Types.Mixed,
  },

  localized: {
    default: null,
    sample: { 'default': 'In Default lang', ko: 'In Korean', },
    db: mongoose.Schema.Types.Mixed,
  },

  __type: 'modelFieldType',

  isType: function(type) {
    return type && _.has(type, '__type') && type.__type === this.__type;
  },

  isComplexType: function(type) {
    // TODO: go through all the kids
    return _.isObject(type);
  },

  /**
   * Checks whether it is a valid id
   */
  isValidId: function(id) {
    return (id instanceof mongoose.Types.ObjectId ||
      mongoose.Types.ObjectId.isValid(id));
  },
};

// inject all types with an identifier
_.keys(types).forEach(function(key) { types[key].__type = types.__type; });

module.exports = types;
