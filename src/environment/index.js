var constants = require('../../constants');

var env = process.env.NODE_ENV || constants.ENVIRONMENTS.release;

module.exports = {
  isDebug: (env === constants.ENVIRONMENTS.debug),
  isDev: (
    env === constants.ENVIRONMENTS.dev ||
    env === constants.ENVIRONMENTS.debug
  ),
  isTest: (env === constants.ENVIRONMENTS.test),
  isRelease: (env === constants.ENVIRONMENTS.release),

  name: env,
};
