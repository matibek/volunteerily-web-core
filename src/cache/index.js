var cacheBase = require('./base');

function constructCache(info) {

  // dynamically build the model class
  var CacheModel = cacheBase.constructCacheClass(info);

  return {

    isCacheModel: true,

    /**
     * The name of the cache model
     */
    name: CacheModel.prototype.__name,

    /**
     * Info of the model
     */
    info: info,

    /**
     * Whether or not it's loaded
     */
    isLoaded: function() {
      return CacheModel.prototype.isLoaded();
    },

    /**
     * Load the db
     */
    load: function() {
      return CacheModel.prototype.load.apply(CacheModel.prototype, arguments);
    },

    /**
     * Load the db
     */
    search: function() {
      return CacheModel.prototype.search.apply(CacheModel.prototype, arguments);
    },

  };

}

module.exports = {
  constructCache: constructCache,
  setConnection: cacheBase.setConnection,
  setDataProvider: cacheBase.setDataProvider,
};
