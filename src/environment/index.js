var _ = require('lodash');
var constants = require('../../constants');

function getEnvironment(env) {
  return {
    isDebug: (env === constants.ENVIRONMENTS.debug),
    isDev: (
      env === constants.ENVIRONMENTS.dev ||
      env === constants.ENVIRONMENTS.debug
    ),
    isTest: (env === constants.ENVIRONMENTS.test),
    isRelease: (env.indexOf(constants.ENVIRONMENTS.release) >= 0),

    name: env,
  };
}

module.exports = _.merge(
  {},
  getEnvironment(process.env.NODE_ENV || constants.ENVIRONMENTS.release),
  {
    getEnvironment: getEnvironment,
  }
);
