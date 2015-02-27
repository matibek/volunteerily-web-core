var api = {

  /**
   * Handler for app errors
   */
  handleAppErrors: function handleAppErrors(err, req, res) {

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
    // TODO: if on release, return generic error
    var clientErr = {
      code: err.code,
      name: err.__name,
      message: err.message,
      err: err,
    };

    // xhr? return a json
    if (req.xhr) {
      return res
        .status(err.clientCode || 500)
        .send(clientErr);
    }

    // TODO: if on release, just redirect to a 500 url

    // redirect to an error page
    return res.render(
      'error',
      clientErr,
      function(err, html) {
        if (err) {
          res.send('Server error: ' + err.message);
        }

        res.send(html);
      }
    );

  }
};

module.exports = api;
