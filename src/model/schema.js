var _ = require('lodash');
var mongoose = require('mongoose');
var util = require('../util');
var types = require('./types');

function convertToMongoose(info) {
  var schema = _.transform(
    info.fields,
    function(result, value, key) {

      // ignore _id because it is required
      if (key === '_id') {
        return;
      }

      // recursive
      var convert = convertType(info.name, key, value.type);
      if (convert) {
        result[key] = convert;
        return;
      }

      // unknown, then ignore
      logger.warning(
        'Unknown type for schema conversion (' + info.name + 'ViewModel)',
        key
      );
    },
    {}
  );

  return {
    schema: schema,
    mongooseSchema: new mongoose.Schema(
      schema,
      {
        collection: info.db.collection,
        versionKey: info.db.version || '1',
        autoIndex: false,
      }
    ),
  };
}

function convertType(name, key, type) {

  // simple type
  if (types.isType(type)) {
    return type.db;
  }

  // array type
  if (_.isArray(type)) {
    return [convertType(name, key, type[0])];
  }

  // complex type
  if (types.isComplexType(type)) {
    return _.transform(
      type,
      function(result, value, child) {
        var convert = convertType(name, child, value);
        if (convert) {
          result[child] = convert;
        }
      },
      {}
    );
  }

  // unknown, then ignore
  logger.warning(
    'Unknown child type for schema conversion (' + name + 'ViewModel)',
    key
  );

  return null;
}

module.exports = {
  convertToMongoose: convertToMongoose,
};
