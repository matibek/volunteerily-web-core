var chalk = require('chalk');
var constants = require('../../constants');
var moment = require('moment');
var util = require('util');
var env = require('../environment');
var _ = require('lodash');

/**
 * Logger class
 */
function Logger() {

  // enables color
  chalk.enabled = true;

  // log context for partial logging
  this._context = {};
}

Logger.prototype = _.create(Object.prototype, {

  error: function logError(err) {
    // if (env.isTest) {
    //   return;
    // }

    prettyLog(
      console.error,
      chalk.white.bgRed.bold('Error'),
      chalk.red,
      arguments
    );
  },

  warn: function warn() {
    this.warning.apply(this, arguments);
  },

  warning: function logWarning() {
    // if (env.isTest) {
    //   return;
    // }

    prettyLog(
      console.warn,
      chalk.yellow.bgRed.bold('Warning'),
      chalk.gray,
      arguments
    );
  },

  log: function log() {
    this.info.apply(this, arguments);
  },

  info: function info() {
    if (env.isTest) {
      return;
    }

    prettyLog(
      console.info,
      chalk.white.bgBlue.bold('Info'),
      chalk.blue,
      arguments
    );
  },

  test: function logTest() {
    if (!env.isTest) {
      return;
    }

    prettyLog(
      console.log,
      chalk.gray('Test'),
      chalk.green,
      (arguments.length === 0) ? ['HERE'] : arguments
    );
  },

  debug: function logDebug() {
    if (!env.isDev) {
      return;
    }

    prettyLog(
      console.log,
      chalk.gray('Debug'),
      chalk.green,
      (arguments.length === 0) ? ['HERE'] : arguments
    );
  },

  trace: function logTrace() {
    if (!env.isDev) {
      return;
    }

    console.trace.apply(console, arguments);
  },

  /**
   * Enables a context for logging
   */
  enableContext: function enableLogContext(context, enable) {
    this._context[context] = enable !== false;
  },

  /**
   * Logs only if a context is enabled
   */
  context: function context(context, message) {
    if (!this._context[context]) {
      return;
    }

    prettyLog(
      console.log,
      chalk.gray(context),
      chalk.green,
      (arguments.length === 0) ?
        ['HERE'] :
        Array.prototype.slice.call(arguments, 1)
    );
  },
});

function errorToLog(err, color) {
  return color(err.toString()) +
    chalk.reset('\n') +
    chalk.gray.bgBlack.bold('Stack: ') +
    chalk.gray.bgBlack(err.stack);
}

/**
 * Parses the arguments for pretty printing
 */
function prettyLog(method, prepend, color, args) {

  var arrArgs = Array.prototype.slice.call(args);
  for (var i=0; i<arrArgs.length; i++) {

    // pretty print errors with stack
    if (arrArgs[i] instanceof Error) {
      var str = '\n\n' + errorToLog(arrArgs[i], color);

      // display the innerErr too
      var innerErr = arrArgs[i].innerErr;
      while (innerErr instanceof Error) {
        str += '\n\n' + errorToLog(innerErr, color);
        innerErr = innerErr.innerErr;
      }

      arrArgs[i] = str;
    }

    // pretty print method name only
    else if (_.isFunction(arrArgs[i])) {
      arrArgs[i] = arrArgs[i].name || '[function anonymous]';
    }
  }

  // current line of the invocation
  var stackCurrentLine = new Error()
    .stack
    .match(/Error.*\n.*\n.*\n.*\((.*)\)\n[.\s\S]*/);

  stackCurrentLine = chalk.gray('@' + (
    stackCurrentLine ?
    stackCurrentLine[1].trim() :
    'Unknown location invocation'
  ));

  // log
  method.call(
    console,
    '%s %s: %s %s',
    chalk.gray(moment().format('MM/DD hh:mma')),
    prepend,
    color(util.format.apply(util, arrArgs)),
    color(stackCurrentLine)
  );
}

module.exports = new Logger();
