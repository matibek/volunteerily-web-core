var _ = require('lodash');
var environment = require('../../environment');

var api = {

  /**
   * Handler for app errors
   */
  handleAppErrors: function handleAppErrors(err, req, res, next) {

    // wrap in a ServerError if needed
    if (!(err instanceof errors.ServerError)) {
      var serverError = new errors.ServerError(err.message || err);
      serverError.stack = err.stack || new Error().stack;
      err = serverError;
    }

    // other errors are "expected"
    if (err.clientCode >= 500) {
      logger.error('Unhandled error', err);
    }

    // convert err to client err
    var clientErr = {
      code: err.code,
      name: err.__name,
      message: err.message,
      err: environment.isRelease ? _.omit(err, 'stack') : err, // only return stack on non release
    };

    // xhr? return a json
    if (req.xhr) {
      return res
        .status(err.clientCode || 500)
        .send(clientErr);
    }

    // TODO: if on release, just redirect to a 500 url
    var errorPage = 'errors/500';

    if (err.clientCode === 403 || err.clientCode === 400) {
      errorPage = 'errors/403';
    }

    // redirect to an error page
    return res.render(
      errorPage,
      clientErr,
      function(err, html) {
        if (err) {
          res.send('Server error: ' + err.message);
        }

        res.send(html);
      }
    );

  },

  /**
   * Handler for not found (404 error)
   */
   handleNotFoundError: function handleNotFoundError(req, res, next) {

     var errorPage = 'errors/404';
     // redirect to an error page
     return res.render(errorPage);
   }
};

module.exports = api;
