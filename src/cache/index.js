var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var promise = require('../promise');

var defaultConfig = {
  db: {
    separator: '$',
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

  this.isCacheModel = true;
  this.name = this.__name;
  this.info = this.__info;
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
        return this._get(this._key('config'))
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
          this._key('config'),
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

          if (that._type('map')) {
            that._initializeMap(key, child.map);
          }

          if (that._type('autocomplete')) {
            that._initializeAutocomplete(key, child.alias, options);
          }

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

  _type: function(type) {
    return _.indexOf(this.__info.data.type, type) >= 0;
  },

  /**
   * Initialize map
   */
  _initializeMap: function(key, map) {
    if (!map) {
      logger.warning(key + ' has no map information');
      return;
    }

    this._hset(this._key('map'), key, JSON.stringify(map));
  },

  /**
   * Initialize autocomplete
   */
  _initializeAutocomplete: function(key, alias, options) {
    assert(this.__db, 'DB not initialized');
    assert(this.__dataProvider, 'DataProvider not initialized');

    // get the language value
    _.forIn(this.__dataProvider.getAllData(this.__info.db.key + '.' + key), function(value, lang) {
      this._decomposeAutocompleteWord(this._key('autocomplete', lang), value, key, options);
    }.bind(this));
  },

  /**
   * Decompose a word for autocomplete
   */
  _decomposeAutocompleteWord: function(key, text, value, options) {

    // store as lower
    text = text.toLowerCase().replace(/ /g,'');

    // substrings
    for (var i=options.min; i<=text.length; i++) {
      this._zadd(key, text.substring(0, i));
    }

    // end of search
    this._zadd(key, text + this.__info.db.separator + value);
  },

  _hset: function(key, field, value) {
    assert(this.__db, 'DB not initialized');

    return promise.nfcall(
      this.__db.hset.bind(this.__db),
      this.__part + key,
      field,
      value
    );
  },

  _hget: function(key, field) {
    assert(this.__db, 'DB not initialized');

    return promise.nfcall(
      this.__db.hget.bind(this.__db),
      this.__part + key,
      field
    );
  },

  _zadd: function(key, value, priority) {
    assert(this.__db, 'DB not initialized');

    return promise.nfcall(
      this.__db.zadd.bind(this.__db),
      this.__part + key,
      priority || 0,
      value
    );
  },

  _zrank: function(key, value) {
    assert(this.__db, 'DB not initialized');

    return promise.nfcall(
      this.__db.zrank.bind(this.__db),
      this.__part + key,
      value
    );
  },

  _zrange: function(key, index, mtu) {
    assert(this.__db, 'DB not initialized');

    return promise.nfcall(
      this.__db.zrange.bind(this.__db),
      this.__part + key,
      index,
      index + mtu - 1
    );
  },

  _set: function(key, value) {
    assert(this.__db, 'DB not initialized');

    return promise.nfcall(
      this.__db.set.bind(this.__db),
      this.__part + key,
      value
    );
  },

  _get: function(key) {
    assert(this.__db, 'DB not initialized');

    return promise.nfcall(
      this.__db.get.bind(this.__db),
      this.__part + key
    );
  },

  _key: function(type, lang) {

    if (type === 'config') {
      return this.__info.db.key + '.config';
    }

    if (type === 'autocomplete') {
      return this.__info.db.key + '.a' + this.__info.db.separator + lang;
    }

    if (type === 'map') {
      return this.__info.db.key + '.m';
    }

    throw new errors.NotImplemented('Unknown type ' + type + ' for cache key');
  },

  /**
   * Searches from cache
   */
  autocomplete: function(search, lang) {
    var separator = this.__info.db.separator;
    var dbKey = this._key('autocomplete', lang);
    var prefix = this.__info.db.key + '.';
    var mtu = 50;
    var i18n = this.__dataProvider;
    search = search.toLowerCase().replace(/ /g,'');

    return promise.create()
      .then(function() {
        return this._zrank(dbKey, search);
      }.bind(this))
      .then(function(result) {
        if (result === null) {
          return [];
        }

        return this._zrange(
          dbKey,
          result,
          mtu
        );

      }.bind(this))
      .then(function(result) {

        return _
          .chain(result)
          .filter(function(value) {
            var textEndIndex = value.indexOf(separator);
            if (textEndIndex < 0) {
              return false;
            }

            var text = value.substring(0, textEndIndex);
            return text.indexOf(search) >= 0;
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

  map: function(key) {
    return promise.create()
      .then(function() {
        return this._hget(this._key('map'), key);
      }.bind(this))
      .then(function(map) {

        if (!map) {
          logger.warning('Map not found for place', key)
          return {};
        }

        return JSON.parse(map);
      });
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
  CacheBase.prototype.__part = db.adaptor.part + ':';
  CacheBase.prototype.__db = db.adaptor.client;
}

/**
 * Reset the cache
 */
function resetCache(find) {
  return function() {

    find = find ? find : CacheBase.prototype.__part + '*';

    return promise.create()
      .then(function() {
        return promise.nfcall(
          CacheBase.prototype.__db.keys.bind(CacheBase.prototype.__db),
          find
        );

      })
      .then(function(keys) {
        return promise.all([
          _.map(keys, function(key) {
            logger.debug(key)
            return promise.nfcall(
              CacheBase.prototype.__db.del.bind(CacheBase.prototype.__db),
              key
            );
          })
        ]);
      });
  };
}

/**
 * Sets the data provider (localization)
 */
function setDataProvider(dataProvider) {
  CacheBase.prototype.__dataProvider = dataProvider;
}

module.exports = {
  constructCache: function(info) {
    var CacheObject = constructCacheClass(info);
    return new CacheObject();
  },
  setConnection: setConnection,
  setDataProvider: setDataProvider,
  reset: resetCache(),
  resetAll: resetCache('*'),
};
