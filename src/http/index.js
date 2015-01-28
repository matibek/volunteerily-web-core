var _ = require('lodash');
var http = require('http');
var https = require('https');
var parse = require('url').parse;
var promise = require('../promise');

var api = {

  /**
   * Sends an http request
   */
  send: function send(url, method, body, headers) {
    var defer = promise.defer();

    var parsed = parse(url);

    var protocol = (parsed.protocol === 'https:') ? https : http;

    var options = {
      hostname: parsed.host,
      port: parsed.port,
      path: parsed.path,
      headers: _.merge({}, headers, body ? {
        'Content-Type': 'application/json',
      } : {}),
      method: method,
    };

    var req = protocol.request(options, function(res) {

      // body
      var result = '';

      res.on('data', function(chunk) {
        result += chunk;
      });

      res.on('end', function() {

        var body = result;

        try {
          body = JSON.parse(result);
        }
        catch(err) {
          body = result;
        }

        defer.resolve({
          statusCode: res.statusCode,
          body: body,
        });
      });

    });

    // error
    req.on('error', function(err) {
      defer.reject(err);
    });

    // body
    if (body) {
      req.write(JSON.stringify(body));
    }

    // send
    req.end();

    return defer.promise;
  },
};

module.exports = api;
