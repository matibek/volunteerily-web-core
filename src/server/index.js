var _ = require('lodash');
var authenticationMiddleware = require('./middleware/authentication');
var permissionMiddleware = require('./middleware/permission');
var Server = require('./server');

module.exports = {
  Server: Server,

  AuthenticationStrategy: authenticationMiddleware.AuthenticationStrategy,
  PermissionStrategy: permissionMiddleware.PermissionStrategy,

  middleware: {
    requireAuthentication: authenticationMiddleware.requireAuthentication,
    requirePermission: permissionMiddleware.requirePermission,
  },
};
