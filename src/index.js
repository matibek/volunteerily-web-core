
var assert = require('assert');
var config = require('./config');
var cache = require('./cache');
var crypto = require('./crypto');
var Db = require('./db');
var environment = require('./environment');
var errors = require('./errors');
var events = require('./events');
var http = require('./http');
var logger = require('./logger');
var Mailer = require('./mailer');
var model = require('./model');
var permission = require('./permission');
var promise = require('./promise');
var template = require('./template');
var regex = require('./regex');
var server = require('./server');
var util = require('./util');

// make some stuff available everywhere as soon as core is included
global.logger = logger;
global.errors = errors;
global.assert = assert;
global.assertClient = function(condition) {

  // wrap the err with a Validation err so we don't return a 500 AssertionError

  if (!condition) { // OPTIMIZATION: precheck cond so we don't go in the try
    try{
      assert.apply(assert, arguments);
    }
    catch(err){
      throw new errors.Validation(err.message, err);
    }
  }
};

module.exports = {
  cache: cache,
  config: config,
  crypto: crypto,
  Db: Db,
  env: environment,
  environment: environment,
  errors: errors,
  events: events,
  http: http,
  logger: logger,
  Mailer: Mailer,
  model: model,
  permission: permission,
  promise: promise,
  regex: regex,
  Server: server.Server,
  server: server,
  template: template,
  util: util,
};
