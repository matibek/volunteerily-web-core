var constants = require('../../constants');
var env = require('../environment').name;
var fs = require('fs');
var path = require('path');
var logger = require('../logger');

function getFullPath(environment) {
  var configPath = 'config' + (environment ? '.' + environment : '');
  return path.join(process.cwd(), configPath + '.js');
}

var configPath = getFullPath(env);
var configExist = fs.existsSync(configPath);

// support no debug config -> bump to dev config
if (!configExist && env === constants.ENVIRONMENTS.debug) {
  configPath = getFullPath(constants.ENVIRONMENTS.dev);
  configExist = fs.existsSync(configPath);
}

// support no release 
if (!configExist && env === constants.ENVIRONMENTS.release) {
  configPath = getFullPath();
  configExist = fs.existsSync(configPath);
}

// load config
if (!configExist) {
  logger.error('Config file doesn\'t exist: ' + configPath);
}

module.exports = configExist ? require(configPath) : {};
