var _ = require('lodash');
var PermissionStorageObject = require('./storageObject');
var util = require('../util');
var validator = require('./validator');

module.exports = _.merge(validator, {
  PermissionStorageObject: PermissionStorageObject,
});
