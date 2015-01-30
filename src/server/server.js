var _ = require('lodash');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var env = require('../environment');
var errorHandler = require('./middleware/errorHandler');
var events = require('../events');
var express = require('express');
var favicon = require('serve-favicon');
var methodOverride = require('method-override');
var middleware = require('./middleware');
var morgan = require('morgan');
var path = require('path');
var promise = require('../promise');
var Router = require('./routing/router');
var util = require('../util');

/**
 * Creates an instance of the server.
 * @class
 * @extends {ObservableObject}
 */
function Server(options) {
  events.ObservableObject.call(this);

  /**
   * Options passed to the server
   * @member {Object}
   */
  this.options = options;

  /**
   * The underlying server object (Express)
   * @member {Object}
   */
  this.app = express();

  /**
   * The list of strategies used
   */
  this.strategies = [];

  // started instance, needed for stopping
  this._instance = null;

  this._init();
}

Server.prototype = {

////////////////////////////////////////////////////////////////////////////////
// Public
////////////////////////////////////////////////////////////////////////////////

  /**
  * Initializes the server with the route
  *
  * @param {Method} route - The route configuration
  * @return {Server} - {@link Server} instance (this) for chaining
  */
  route: function (route) {
    var router = new Router(this);
    route.call(this, router);
    this.app.use(router.expressRouter);

    return this; // chaining
  },

  /**
   * Makes the server use middleware
   *
   * @return {Server} - {@link Server} instance (this) for chaining
   */
  use: function(middleware) {

    this.app.use(middleware);

    return this; // chaining
  },

  /**
   * Uses strategies
   *
   * @return {Server} - {@link Server} instance (this) for chaining
   */
  strategy: function(strategy) {

    middleware.setStrategy(strategy, this);
    this.strategies.push(strategy);

    return this; // chaining
  },

  /**
   * Sets data to the view
   *
   * @return {Server} - {@link Server} instance (this) for chaining
   */
  viewData: function(key, value) {

    assert(key, 'Expected a key');

    var data = this.app.get('view data') || {};
    data[key] = value;
    this.app.set('view data', data);

    return this; // chaining
  },

  /**
   * Initializes the server static path
   *
   * @param {String} virtualPath - The url path to serve
   * @param {String} dirPath - The path on the server to serve
   * @return {Server} - {@link Server} instance (this) for chaining
   */
  static: function(virtualPath, dirPath) {

    if (arguments.length === 1) {
      dirPath = virtualPath;
      virtualPath = '/';
    }

    this.app.use(
      virtualPath,
      express.static(dirPath)
    );

    return this; // chaining
  },

  /**
   * Starts the server
   *
   * @return {Promise} A promise
   * @emits Server#Server:started
   */
  start: function() {

    if (!this._instance) {
      this._initEnd();
    }

    var defer = promise.defer();

    this._instance = this.app.listen(
      process.env.PORT || this.options.port, // lets the port be set by Heroku
      function() {

        /**
         * Fired when the server is started
         * @event Server#Server:started
         */
        this.emit('started');

        defer.resolve(this);
      }.bind(this));

    return defer.promise;
  },

  /**
   * Stops the server
   *
   * @return {Promise} A promise
   * @emits Server#Server:stopped
   */
  stop: function() {
    if (!this._instance) {
      throw new errors.ServerError('Cannot stop server, not started');
    }

    var defer = promise.defer();

    this._instance.close(function() {

      /**
      * Fired when the server is stopped
      * @event Server#Server:stopped
      */
      this.emit('stopped');

      defer.resolve();
    }.bind(this));

    return defer.promise;
  },

////////////////////////////////////////////////////////////////////////////////
// Private
////////////////////////////////////////////////////////////////////////////////

  /***
  * Initializes the server with the route
  */
  _init: function() {

    // favicon
    if (this.options.favicon) {
      this.app.use(favicon(this.options.favicon));
    }

    // set the view engine
    this.app.set('views', this.options.views);

    _.forIn(this.options.viewEngines, function(value, key) {
      var engine;
      var engineMethod;

      // support consolidate
      var consolidateString = 'consolidate.';
      if (util.string.startsWith(value.engine, consolidateString)) {
        var consEngine = value.engine.substring(consolidateString.length);
        engine = require('consolidate');
        engineMethod = engine[consEngine];
      }

      // everything else
      else {
        engine = require(value.engine);
        engineMethod = engine.__express;
      }

      // set express
      if (_.has(engine, 'settings')) {
        engine.settings.header = this.options.viewHeader || '';
      }

      this.app.engine(key, engineMethod);

      // default engine
      if (!!value.default) {
        this.app.set('view engine', key);
      }
    }, this);

    if (env.isDev) {
      //this.app.set('view cache', true);
      //engine.settings.stripComment = true;
      //engine.settings.stripWhitespace = true;
    }

    // body parsing
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // cookie
    this.app.use(cookieParser(this.options.cookieSecret));

    // localization
    if (this.options.i18n) {
      var i18n = require('i18n');
      i18n.configure(this.options.i18n);

      // export localization method
      this.app.set('view shortcut', { t: '__', locale: 'locale', })

      // attach __ to local and res
      this.app.use(i18n.init);
    }

    // method override
    this.app.use(methodOverride());

    // logging
    if (env.isDev) {
      //app.use(morgan('combined'));
    }
  },

  /**
   * Initializing at the end
   */
  _initEnd: function() {

    // error handling
    this.app.use(errorHandler.handleAppErrors);
  },
};

//
// Inheritance
//
Server.prototype = _.create(
  events.ObservableObject.prototype,
  Server.prototype
);

module.exports = Server;
