var _ = require('lodash');
var util = require('../util');

var api = {

  /**
   * Builds a permission code given a list of permissions
   */
  getPermissionCode: function(permissions) {
    return _.reduce(arguments, function(result, permission) {
      return result |= permission;
    });
  },

  /**
   * Shortcut to permission code
   */
  or: function() {
    return this.getPermissionCode.apply(this, arguments);
  },

  /**
   * Checks a permission against a code
   */
  hasPermission: function(code, permission) {
    return (code & permission) !== 0;
  },

};

module.exports = api;
