var constants = require('../../constants');
var env = require('../environment').name;
var fs = require('fs');
var path = require('path');
var logger = require('../logger');

function getFullPath(environment) {
  var configPath = 'config' + (environment ? '.' + environment : '');
  return path.join(process.cwd(), configPath + '.js');
}

function load() {

  // 1. config.js
  var configPath = getFullPath();
  var configExist = fs.existsSync(configPath);

  if (configExist) {
    return require(configPath);
  }

  // 2. config.[env].js
  configPath = getFullPath(env);
  configExist = fs.existsSync(configPath);

  if (configExist) {
    return require(configPath);
  }

  // 3. debug -> dev
  if (!configExist && env === constants.ENVIRONMENTS.debug) {
    configPath = getFullPath(constants.ENVIRONMENTS.dev);
    configExist = fs.existsSync(configPath);
  }

  if (configExist) {
    return require(configPath);
  }

  // didn't find anything
  logger.error('Config file doesn\'t exist: ' + configPath);
  return {};
}

module.exports = load();
