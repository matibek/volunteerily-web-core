var _ = require('lodash');
var environment = require('../../environment');
var fs = require('fs');
var path = require('path');
var promise = require('../../promise');

// map to the error pages
var errorPages = {};

var api = {

  /**
   * Initialize the error path
   */
  initializeErrorPath: function(errorPath) {
    return promise.create()
      .then(function() {
        return promise.nfcall(
          fs.readdir.bind(fs),
          errorPath
        );
      })
      .then(function(files) {
        _.forEach(files, function(file) {

          var filename = file;
          var ext = '';
          var extIndex = file.lastIndexOf('.');
          if (extIndex > 0) {
            filename = file.substring(0, extIndex);
            ext = file.substring(extIndex + 1);
          }

          errorPages[filename] = {
            fullpath: path.join(errorPath, file),
            filename: file,
            name: path.join(errorPath, filename),
            ext: ext,
          };
        });

        logger.debug(errorPages);
      })
      .fail(function(err) {
        logger.debug(errorPath, err);
      })
      .done();
  },

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

    // error page
    var errorPage = errorPages[err.clientCode.toString()];

    // debug
    if (environment.isDev && errorPages['debug']) {
      errorPage = errorPages['debug'];
    }

    // no page
    if (!errorPage) {

      // no page
      if (!errorPages['500']) {
        return res
          .status(err.clientCode || 500)
          .send('No error page specified for ' + (err.clientCode || 500));
      }

      // default to 500
      errorPage = errorPages['500'];
    }

    // redirection HTML files
    if (errorPage && errorPage.ext === 'html') {
      return res
        .status(err.clientCode || 500)
        .send(fs.readFileSync(errorPage.fullpath, 'utf8'));
    }

    // redirection viewEngine
    return res.render(
      errorPage.name,
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
     return res.render(errorPage);
   }
};

module.exports = api;
