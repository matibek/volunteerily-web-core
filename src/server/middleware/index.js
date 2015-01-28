var _ = require('lodash');
var util = require('../../util');

/**
 * Sets the strategy to all the middleware
 */
function setStrategy(strategy, server) {

  _.forEach(util.requireAll(__dirname), function(module) {
    if (_.isFunction(module['setStrategy'])) {
      module.setStrategy(strategy, server);
    }
  });

}

module.exports = {
  setStrategy: setStrategy,
};
