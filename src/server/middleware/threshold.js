var _ = require('lodash');
var config = require('../../config');
var moment = require('moment');

var sessionKey = config.server.session.threshold.key || 'operationLog';

var api = {

  /**
   * Operation threshold middleware
   */
  operationThreshold: function(config) {
    return function(req, res, options) {

      assert(req, 'Expected req');
      assert(req.session, 'Session is required to use operationThreshold');

      // no operations yet
      if (!req.session[sessionKey]) {
        return options.next();
      }

      // not enough operations
      if (req.session[sessionKey].length < config.max) {
        return options.next();
      }

      // take the last x operation
      req.session[sessionKey] = req.session[sessionKey].slice(-1 * config.max);

      // check time
      var oldest = new moment(req.session[sessionKey][0]);
      var now = new moment();

      if (oldest.add(config.sec, 'seconds') > now) {
        return options.next(
          new errors.TooManyOperations()
        );
      }

      return options.next();
    };
  },

  /**
   * Middleware helper couter for successful operation
   */
  setOperationSuccess: function(req, res) {

    assert(req, 'Expected req');
    assert(req.session, 'Session is required to use operationThreshold');

    if (!req.session[sessionKey]) {
      req.session[sessionKey] = [];
    }

    req.session[sessionKey].push(new Date());
  },
};

module.exports = api;
