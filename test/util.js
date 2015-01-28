var constants = require('../constants');
var core = require('..');
var fs = require('fs');
var http = require('http');
var path = require('path');
var promise = core.promise;
var sign = require('cookie-signature').sign;
var util = require('util');
var _ = require('lodash');

// #############################################################################
// Run tasks
// #############################################################################

var server;
var db;

var commands = {

  /**
   * Connects to the db
   */
  'db-connect': function() {
    db = new core.Db().init(core.config.db);
    return db.connect();
  },

  /**
   * Disconnects from the db
   */
  'db-disconnect': function() {
    db.disconnect();
  },

  /**
   * Cleans the fixture
   */
  'db-clean': function() {
    return core.promise.nfcall(
      db.connection.db.dropDatabase.bind(db.connection.db)
    );
  },
};

function run(tasks, done) {

  _.reduce(tasks, function(result, task) {
    return result.then(function() {
      return commands[task]();
    });
  }, core.promise.create())

    .then(function() { done(); })
    .fail(function(err) { done(err); })
    .end();
}

// #############################################################################
// DB stuff
// #############################################################################

function prepareDb(info) {

  core.model.setConnection(db);

  return core.promise.create()
    .then(function() {
      var viewModel = core.model.constructModel(info);
      return core.promise.all([
        viewModel,
        viewModel.create(info.data),
      ]);
    })
    .then(function(results) {
      return {
        viewModel: results[0],
        data: results[1],
      };
    });
}

// #############################################################################
// Http stuff
// #############################################################################

function buildHeaders(auth, permission) {

  function cookieValue(obj) {
    var signed = 's:' + sign(
      'j:' + JSON.stringify(obj),
      core.config.server.cookieSecret
    );

    return encodeURIComponent(signed);
  }

  var cookie = '';

  if (auth) {
    cookie += util.format(
      '%s=%s; ',
      constants.COOKIE.auth.key,
      cookieValue(auth)
    );
  }

  if (permission) {
    cookie += util.format(
      '%s=%s; ',
      constants.COOKIE.permission.key,
      cookieValue(permission.serialize())
    );
  }

  return {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
    'Cookie': cookie,
  };
}

function send(path, method, json, auth, permission) {
  var defer = promise.defer();

  var options = {
    hostname: 'localhost',
    port: core.config.server.port,
    path: path,
    method: method,
    headers: buildHeaders(auth, permission),
  };

  var req = http.request(options, function(res) {

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
  if (method !== 'GET') {
    req.write(JSON.stringify(json));
  }
  req.end();

  return defer.promise;
}

module.exports = {
  run: run,
  send: send,

  db: {
    prepareDb: prepareDb,
  },

  http: {
    send: send,
  },
};
