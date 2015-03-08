var _ = require('lodash');
var constants = require('../../constants');
var fs = require('fs');
var path = require('path');

/**
 * Gets a value of an object given a dotNotation
 */
function getValue(obj, dotNotation) {

  var paths= dotNotation.split('.');
  return _.reduce(
    paths,
    function(nav, i) {
      if (!nav) {
        return null;
      }

      // support methods
      if (_.isFunction(nav)) {
        return nav.call(null, i);
      }

      return nav[i];
    },
    obj
  );
}

/**
 * Sets a value to an object using dotNotation
 */
function setValue(obj, dotNotation, value) {

  var path = dotNotation.split('.');

  _.forEach(path, function(key, i) {

    // set
    if (i+1 === path.length && value !== undefined) {
      obj[key] = value;
    }

    // default object
    if (!_.has(obj, key)) {
      obj[key] = {};
    }

    obj = obj[key];
  });

  return obj;
}

var api = {

  /**
   * Require all the files from the given path (excluding index.js)
   *
   * @param {String} fullPath - The path to require
   * @return {Array} - The list of modules
   */
  requireAll: function(fullPath) {
    var modules = _.chain(fs.readdirSync(fullPath))
      .reject(function(file) {
        return file === 'index.js';
      })
      .reduce(function(result, file) {
        var module = file.substr(0, file.lastIndexOf('.'));
        result[module] = require(path.join(fullPath, module));
        return result;
      }, {})
      .valueOf();

    return modules;
  },

  /**
   * Lists the full path files
   */
  listFiles: function(fullPath) {

    function walk(dir) {
      return _.reduce(fs.readdirSync(dir), function(result, file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
          result = _.union(result, walk(file));
        }
        else {
          result.push(file.substring(fullPath.length + 1));
        }

        return result;
      }, []);
    };

    return walk(fullPath);
  },

  /**
   * Clones a model
   */
  cloneModel: function(obj) {

    if (!obj) {
      return obj;
    }

    var result = _.clone(obj, true);
    result._id = obj._id;
    return result;
  },
};

module.exports = _.merge({
  string: {
    capitalize: function(input) {
      return input[0].toUpperCase() + input.slice(1);
    },

    startsWith: function(input, find) {
      return input.indexOf(find) == 0;
    }
  },
  object: {
    get: getValue,
    set: setValue,
  },
}, api);
