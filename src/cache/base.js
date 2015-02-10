var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var promise = require('../promise');

var defaultConfig = {
  db: {
    separator: '$',
    configPrefix: 'config_',
  },
};

var defaultLoadOptions = {
  min: 2,
};

/**
 * Initialize a prototype
 */
function initPrototype(constructor, info) {

  // prototype info
  this.__info = _.merge({}, defaultConfig, info);
  this.__name = info.name + 'CacheModel';
  this.__constructor = constructor;
}

function CacheBase() {

};

CacheBase.prototype = _.create(Object.prototype, {

  /**
   * Whether the config is loaded
   */
  isLoaded: function() {
    return promise.create()
      .then(function() {
        return this._get(this.__info.db.configPrefix + this.__info.db.key)
      }.bind(this))
      .then(function(isLoaded) {
        return !!isLoaded;
      });
  },

  /**
   * Sets is loaded
   */
  setLoaded: function() {
    return promise.create()
      .then(function() {
        return this._set(
          this.__info.db.configPrefix + this.__info.db.key,
          new Date()
        );
      }.bind(this));
  },

  /**
   * Initialize cache
   */
  load: function(options) {
    var that = this;
    options = _.merge({}, defaultLoadOptions, options);

    return promise.create()

      // load file
      .then(function() {
        return promise.nfcall(
          fs.readFile,
          that.__info.data.file
        );
      })

      // parse data
      .then(function(result) {
        var data = JSON.parse(String(result));
        return data;
      })

      // load data to db
      .then(function(data) {

        function parse(key, child) {
          that._initializeAutocomplete(key, child.alias, options);

          if (_.has(child, 'children')) {
            _.forIn(child.children, function(value, child) {
              parse(key + that.__info.db.separator + child, value);
            });
          }
        }

        _.forIn(data, function(value, root) {
          parse(root, value);
        });
      })
      .then(function() {
        return that.setLoaded();
      });
  },

  _initializeAutocomplete: function(key, alias, options) {
    assert(this.__db, 'DB not initialized');
    assert(this.__dataProvider, 'DataProvider not initialized');

    // get the language value
    _.forIn(this.__dataProvider.getAllData(this.__info.db.key + '.' + key), function(value, lang) {
      this._decompose(this.__info.db.key + this.__info.db.separator + lang, value, key, options);
    }.bind(this));
  },

  _decompose: function(key, text, value, options) {

    // store as lower
    text = text.toLowerCase();

    // substrings
    for (var i=options.min; i<=text.length; i++) {
      this._zadd(key, text.substring(0, i));
    }

    // end of search
    this._zadd(key, text + this.__info.db.separator + value);
  },

  _zadd: function(key, value, priority) {
    assert(this.__db, 'DB not initialized');

    return promise.nfcall(
      this.__db.zadd.bind(this.__db),
      key,
      priority || 0,
      value
    );
  },

  _zrank: function(key, value) {
    return promise.nfcall(
      this.__db.zrank.bind(this.__db),
      key,
      value
    );
  },

  _set: function(key, value) {
    assert(this.__db, 'DB not initialized');

    return promise.nfcall(
      this.__db.set.bind(this.__db),
      key,
      value
    );
  },

  _get: function(key) {
    assert(this.__db, 'DB not initialized');

    return promise.nfcall(
      this.__db.get.bind(this.__db),
      key
    );
  },

  /**
   * Searches from cache
   */
  search: function(search, lang) {
    var separator = this.__info.db.separator;
    var dbKey = this.__info.db.key + this.__info.db.separator + lang;
    var prefix = this.__info.db.key + '.';
    var mtu = 50;
    var i18n = this.__dataProvider;
    search = search.toLowerCase();

    return promise.create()
      .then(function() {
        return promise.nfcall(
          this.__db.zrank.bind(this.__db),
          dbKey,
          search
        );
      }.bind(this))
      .then(function(result) {
        if (result === null) {
          return [];
        }

        return promise.nfcall(
          this.__db.zrange.bind(this.__db),
          dbKey,
          result,
          result + mtu - 1
        );
      }.bind(this))
      .then(function(result) {

        return _
          .chain(result)
          .filter(function(value) {
            return value.indexOf(separator) >= 0 && value.indexOf(search) >= 0;
          })
          .map(function(value) {
            var key = value.substring(value.indexOf(separator) + 1);
            return {
              key: key,
              value: i18n.getData(prefix + key, lang),
            };
          })
          .valueOf();
      }.bind(this));

  },

});

/**
 * Validates a definition
 * @param {Object} def The definition
 * @return {undefined} Throws err
 */
function validateInfo(info) {

  // validate name
  if (!info || !info.name) {
    throw new errors.ServerError(
      'Model generation failure: info.name is required'
    );
  }

  // validate key
  if (!info.db || !info.db.key) {
    throw new errors.ServerError(
      'Model generation failure: info.db.key is required'
    );
  }

  // validate data
  if (!info.data || !info.data.file) {
    throw new errors.ServerError(
      'Model generation failure: info.data.file is required'
    );
  }

}

function constructCacheClass(info) {
  // throws err
  validateInfo(info);

  // class definition
  var CacheObject = function CacheModel() {
    CacheBase.apply(this, arguments); // call base constructor
  };

  // inherit from ViewModelBase
  CacheObject.prototype = _.create(CacheBase.prototype, {});

  // call base prototype constructor
  initPrototype.call(
    CacheObject.prototype,
    CacheObject,
    info
  );

  return CacheObject;
}

/**
 * Sets the db connection to the model
 */
function setConnection(db) {
  CacheBase.prototype.__db = db.adaptor.client;
}

function setDataProvider(dataProvider) {
  CacheBase.prototype.__dataProvider = dataProvider;
}

module.exports = {
  constructCacheClass: constructCacheClass,
  setConnection: setConnection,
  setDataProvider: setDataProvider,
};
