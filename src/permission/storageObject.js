var _ = require('lodash');
var util = require('../util');
var validator = require('./validator');

var defaultContext = 'general';
var defaultKey = 'value';

/**
 * @class
 * This is the object that will be stored in the cookie
 */
function PermissionStorageObject() {
  this.context = {};
}

PermissionStorageObject.prototype = _.create(Object.prototype, {

  /**
   * Add some context permission
   */
  setPermission: function(key, value, contextKey) {

    if (!value && !contextKey) {
      value = key;
      key = defaultKey;
      contextKey = defaultContext;
    }

    if (!contextKey) {
      contextKey = defaultContext;
    }

    if (!_.has(this.context, contextKey)) {
      this.context[contextKey] = {};
    }

    this.context[contextKey][key] = value;

    return this; // chaining
  },

  /**
   * Retrieve permission from a sub permission
   */
  getPermission: function(key, contextKey) {

    if (!key && !contextKey) {
      key = defaultKey;
      contextKey = defaultContext;
    }

    if(!key && contextKey) {
      key = contextKey;
      contextKey = defaultContext;
    }

    if (!_.has(this.context, contextKey)) {
      return 0;
    }

    return this.context[contextKey][key] || 0;
  },

  /**
   * Checks with a permission
   */
  hasPermission: function(permission, key) {
    return validator.hasPermission(
      this.getPermission(key, permission.context),
      permission.value
    );
  },

  /**
   * Transform the object for serialization to the cookie
   */
  serialize: function() {
    return this.context;
  },

  /**
   * Transform the cookie object to this object
   */
  deserialize: function(sObject) {
    this.context = sObject;

    return this; // chaining
  },

});

module.exports = PermissionStorageObject;
