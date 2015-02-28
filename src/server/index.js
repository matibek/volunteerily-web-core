var _ = require('lodash');
var middleware = require('./middleware');
var Server = require('./server');

module.exports = {
  Server: Server,

  AuthenticationStrategy: middleware.authentication.AuthenticationStrategy,
  PermissionStrategy: middleware.permission.PermissionStrategy,

  middleware: {
    requireAuthentication: middleware.authentication.requireAuthentication,
    requirePermission: middleware.permission.requirePermission,
    operationThreshold: middleware.threshold.operationThreshold,
  },
};
