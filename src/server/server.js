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
var path = require('path');
var promise = require('../promise');
var Router = require('./routing/router');
var urlUtil = require('url');
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

  /**
   * i18n object
   */
  this.i18n = null;

  // started instance, needed for stopping
  this._instance = null;

  this.desktopUrl = null;
  this.mobileUrl = null;

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

    // port
    var port = process.env.port;

    if (!port) {
      port = process.env.PORT;
    }
    if (!port) {
      port = this.options.port;
    }
    if (!port) {
      port = 8080;
    }

    this._instance = this.app.listen(
      port,
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

    // url
    if (this.options.url.mobile) {
      this.mobileUrl = urlUtil.parse(this.options.url.mobile);
    }

    if (this.options.url.desktop) {
      this.desktopUrl = urlUtil.parse(this.options.url.desktop);
    }
    else {
      this.desktopUrl = urlUtil.parse(this.options.url);
    }

    // favicon
    if (this.options.favicon) {
      this.app.use(favicon(this.options.favicon));
    }

    // set the view engine
    this.app.set('views', this.options.views.root);

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

    // engine optimization
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
      this.i18n = require('i18n');
      this.i18n.configure(this.options.i18n);

      // export localization method
      this.app.set('view shortcut', {
        t: '__',
        locale: 'locale',
        auth: 'auth',
        permission: 'permission',
        query: 'query',
        message: 'message',
      });

      // attach __ to local and res
      this.app.use(this.i18n.init);
    }

    // method override
    this.app.use(methodOverride());

    // logging
    if (env.isDev) {
      //app.use(require('morgan')('combined'));
    }

    // serve the error paths
    if (this.options.views.errors) {
      var errorPath = path.join(this.options.views.root, this.options.views.errors);
      this.static('/errors', errorPath);
      errorHandler.initializeErrorPath(errorPath);
    }
  },

  /**
   * Initializing at the end
   */
  _initEnd: function() {

    // app error handling
    this.app.use(errorHandler.handleAppErrors);

    // not found error
    this.app.use(errorHandler.handleNotFoundError);
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
