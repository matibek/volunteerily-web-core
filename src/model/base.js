var _ = require('lodash');
var config = require('../config');
var db = require('../db');
var EventEmitter = require('events').EventEmitter;
var promise = require('../promise');
var sample = require('./sample');
var schema = require('./schema');
var types = require('./types');
var util = require('../util');
var validators = require('./validators');

var defaultLang = config.i18n
  ? (config.i18n.defaultLocale || 'en')
  : 'en';

/**
 * Initialize a prototype
 */
function initPrototype(constructor, info) {

  var fields = initFields(info);

  // prototype info
  this.__info = fields.info;
  this.__name = info.name + 'ViewModel';
  this.__constructor = constructor;
  this.__eventEmitter = new EventEmitter();
  this.__dbModel = null; // connection to the db

  // db fields space separated (for return object from db)
  this.__fields = fields.fields;
  this.__fieldsLocalized = fields.localized;
}

/**
 * Initialize localized fields
 */
function initFields(info) {

  var result = {
    info: info,
    localized: [],
    fields: {},
  };

  function process(prefix) {

    prefix = prefix ? prefix + '.' : '';

    return function(field, key) {

      // first layer is type
      if (_.has(field, 'type')) {

        // special case for obj, we loop as an obj
        if (!types.isType(field.type) && _.isPlainObject(field.type)) {
          _.forIn(field.type, process(key));
          return;
        }

        process()(field.type, key);
        return;
      }

      // localized type
      if (field === types.localized) {
        result.localized.push({
          key: prefix + key,
          value: 1,
        });

        return;
      }

      // array type
      if (_.isArray(field)) {

        result.fields[prefix + key] = { $slice: -10, }; // latest

        // add count helper
        result.info.fields[prefix + '_' + key + 'Count'] = { type: types.number, };
        result.fields[prefix + '_' + key + 'Count'] = 1; // return by default

        return;
      }

      // subobject
      if (!types.isType(field) && _.isPlainObject(field)) {
        _.forIn(field, process(prefix + key));
        return;
      }

      // return object
      result.fields[prefix + key] = 1;
    }
  }

  _.forIn(info.fields, process());
  return result;
}

/**
 * Base class for ViewModels
 * @param {Object} options The fields value for the ViewModel
 * @param {Bool} transform Whether to call the transform method (create)
 * @param {Bool} fillDefault Whether to put default for fields
 */
function ViewModelBase(options) {

  var opts = _.merge({
    data: {},
    transform: false,
    default: false,
    localize: false,
  }, options);

  // create property from def with options or default values
  _.keys(this.__info.fields).forEach(function(p) {

    // passed values
    if (_.has(opts.data, p) || opts.data[p] !== undefined) {
      if (opts.transform &&
        this.__info.create &&
        _.has(this.__info.create, p) &&
        _.has(this.__info.create[p], 'transform')
      ) {
        this[p] = this.__info.create[p].transform.call(this, opts.data[p]);
        return;
      }

      this[p] = opts.data[p];
    }

    // fill with default values
    else if (opts.default) {

      var defaultValue = null;

      if (_.has(this.__info.fields[p], 'default')) {
        defaultValue = this.__info.fields[p].default;
      }

      else if (_.has(this.__info.fields[p].type, 'default')) {
        defaultValue = this.__info.fields[p].type.default;
      }

      if (_.isFunction(defaultValue)) {
        defaultValue = defaultValue();
      }

      if (!_.has(this, p)) { // might be filled somewhere else e.g. count
        this[p] = defaultValue;
      }
    }

    // count helper
    if (opts.default) {
      if (_.isArray(this[p]) || _.isPlainObject(this[p])) {
        _.forIn(this._handleCount(p), function(value, key) {
          this[key] = value;
        }.bind(this));
      }
    }

  }, this);

  // && _.isArray(this.__info.fields[p].type) && !this['_' + p + 'Count']) {
  //   this['_' + p + 'Count'] = (_.isArray(this[p]) ? this[p].length : 0);
  // }

  // convert format of localized items
  if (opts.localize) {
    this._morphLocalizedFields(opts.localize);
  }
}

ViewModelBase.prototype = _.create(Object.prototype, {

  /**
   * Saves the ViewModel to the DB
   * @param {ObjectId} id (optional) Specify an id for the new object
   * @return {Promise} A promise to the new ViewModel
   */
  create: function(id) {

    assert(this.__info.db.write, this.__name + ' is not writable');

    // get the mongoose model def
    var dbModel = this.getDbModel();

    // call db
    var fields = _.omit(this._cleanObject(), '_id');

    if (id) {
      fields._id = id;
    }

    //logger.debug('Create object', fields);

    return promise.nfcall(dbModel.create.bind(dbModel), fields)
      .then(function(doc) {
        // not found
        if (!doc) {
          return null;
        }

        // rebuild a new ViewModel
        var result = new this.__constructor({ data: doc, });

        // event
        this.emit('create', result);

        return result;
      }.bind(this));
  },

  /**
   * Updates a ViewModel
   * @return {Promise} A promise to the result of the operation
   */
  update: function(find) {

    assert(this.__info.db.write, this.__name + ' is not writable');

    var fields = _.omit(this._cleanObject(), '_id');
    assert(_.keys(fields).length > 0, 'Expected changes to the model');

    if (!find) {
      var id = this._id;
      assert(id, 'Expected id to be present');
      find = { _id: id, };
    }

    return this._update(find, fields);
  },

  /**
   * Update private
   */
  _update: function(find, update) {

    // get the mongoose model def
    var dbModel = this.getDbModel();

    // call db
    return promise.nfcall(
        dbModel.findOneAndUpdate.bind(dbModel),
        find,
        update
      )
      .then(function(doc) {

        // not found
        if (!doc) {
          return null;
        }

        // rebuild a new ViewModel
        var result = new this.__constructor({ data: doc, });

        // event
        this.emit('update', result, update);

        return result;
      }.bind(this));

  },

  /**
   * Updates a status
   */
  updateStatus: function updateStatus(find, status, value) {

    assert(this.__info.db.write, this.__name + ' is not writable');

    assert(find, 'Expected an id');
    assert(status, 'Expected a status');

    var update = {};
    update['status.' + status] = value;

    if (!_.isPlainObject(find)) {
      find = { _id: find, };
    }

    var dbModel = this.getDbModel();
    return promise
      .nfcall(dbModel.findOneAndUpdate.bind(dbModel),
        find,
        update
      )
      .then(function(doc) {

        // not found
        if (!doc) {
          return null;
        }

        // rebuild a new ViewModel
        var result = new this.__constructor({ data: doc, });

        return result;
      }.bind(this));
  },

  /**
   * Finds a Post from the DB
   * @param {ObjectId} id The string representation of an ObjectId
   * @param {Object} options Extra options
   * @return {Promise} A promise to the ViewModel
   */
  findById: function(id, options) {

    options = _.merge({ localize: defaultLang, }, options);

    assert(id, 'Expected an id to be passed');
    assert(
      types.isValidId(id),
      'Expected a valid ObjectId to be passed, got ' + id
    );

    // get the mongoose model def
    var dbModel = this.getDbModel();

    // call the db
    return promise
      .nfcall(
        dbModel.findById.bind(dbModel),
        id,
        this._select(options)
      )
      .then(function(doc) {
        // not found
        if (!doc) {
          return null;
        }

        // convert
        return new this.__constructor({ data: doc, localize: options.localize, });
      }.bind(this));
  },

  /**
   * Find given conditions
   * @return {Promise} A promise to the ViewModel
   */
  find: function(options) {

    options = _.merge({ localize: defaultLang, }, options);

    // get the mongoose model def
    var dbModel = this.getDbModel();

    // build query
    var query = dbModel
      .find(options.conditions || {})
      .select(this._select(options));

    if (options.sorts) {
      query = query.sort(options.sorts)
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.max) {
      query = query.limit(options.max);
    }

    // call the db
    return promise.nfcall(
        query.exec.bind(query)
      )
      .then(function(docs) {

        if (!docs) {
          return [];
        }

        return _.map(docs, function(doc) {
          return new this.__constructor({ data: doc, localize: options.localize, });
        }, this);
      }.bind(this));
  },

  /**
   * Deletes given an ID
   * @return {Promise} A promise to the result
   */
  deleteById: function(id) {

    assert(this.__info.db.write, this.__name + ' is not writable');

    assert(id, 'Expected an id to be passed');
    assert(
      types.isValidId(id),
      'Expected a valid ObjectId to be passed, got ' + id
    );

    // get the mongoose model def
    var dbModel = this.getDbModel();

    // call the db
    return promise.nfcall(
        dbModel.findByIdAndRemove.bind(dbModel),
        id
      )
      .then(function(doc) {

        if (!doc) {
          return null;
        }

        var result = new this.__constructor({ data: doc, });

        // event
        this.emit('delete', result);

        return result;
      }.bind(this));
  },

  /**
   * Delete private
   */
  _delete: function(find) {
    var dbModel = this.getDbModel();
    return promise.nfcall(dbModel.remove.bind(dbModel), find);
  },

  /**
   * Builds a sample object
   * @return {ViewModel} The ViewModel sample
   */
  sample: function buildSampleViewModel() {
    var info = this.__info;
    return _.transform(info.fields, function(result, value, key) {

      // don't process private members
      if (key !== '_id' && key[0] === '_') {
        return;
      }

      result[key] = sample.getSample(key, value);

    });
  },

  /**
   * Validates a parameter passed to the ViewModel constructor
   * @param {Bool} onlyParam Only validates the fields in param
   * @return {this} For chaining
   */
  validate: function (onlyParam) {

    // if no definition, it's valid
    if (!this.__info.create) {
      return this;
    }

    // validate each field

    var result = _.chain(this.__info.create)

      // only present field
      .omit(function(def, field) {
        return (onlyParam && !_.has(this, field));
      }.bind(this))

      // no validator
      .omit(function(def, field) {
        return !_.has(def, 'validators');
      }.bind(this))

      // spread localized
      .reduce(function(result, def, field) {

        if (this.__info.fields[field].type !== types.localized) {
          result[field] = {
            validators: def.validators,
            value: this[field],
          };
          return result;
        }

        _.forIn(this[field], function(value, key) {
          result[field + '.' + key] = {
            validators: def.validators,
            value: value,
          };
        });

        return result;
      }.bind(this), {})

      // validate
      .reduce(function(result, def, field) {
        var results = validators.validate.call(
          this,
          def.validators,
          def.value
        );

        if (_.keys(results).length > 0) {
          result[field] = results;
        }

        return result;
      }, {})

      .valueOf();

    if (_.keys(result).length > 0) {
      //logger.debug(result);

      var validations = _.chain(result)
        .keys()
        .reduce(function(total, key) { return total + ' ' + key; })
        .valueOf();

      throw new errors.Validation({
        message: _.keys(result).length + ' validation error(s).' +
          ' [ ' + validations + ' ]',
        result: result,
      });
    }

    return this;
  },

  /**
   * Builds the query fields (support lang)
   */
  _select: function(options) {

    if (_.has(options, 'fields')) {
      return options.fields;
    }

    // no localized fields
    if (this.__fieldsLocalized.length === 0) {
      return this.__fields;
    }

    // localized fields
    var lang = defaultLang;
    if (_.has(options, 'localize')) {
      lang = options.localize;
    }

    return _.reduce(this.__fieldsLocalized, function(fields, field) {
      var langKey = (options.localize === false) // don't localize
        ? ''
        : '.' + lang;

      fields[field.key + langKey] = field.value;
      return fields;
    }, this.__fields);
  },

  /**
   * Retrieve the clean fields of the view model
   */
  _cleanObject: function() {
    return _.transform(this, function(result, value, key) {
      result[key] = value;
    });
  },

  /**
   * Restructure localized fields
   */
  _morphLocalizedFields: function(lang) {

    _.forEach(this.__fieldsLocalized, function(field) {

      var value = util.object.get(this, field.key);
      var valueLocalized = value;

      if(_.has(value, lang)) {
        valueLocalized = value[lang];
      }
      else if(_.has(value, defaultLang)) {
        valueLocalized = value[defaultLang];
      }

      util.object.set(
        this,
        field.key,
        valueLocalized
      );
    }, this);

  },

  /**
   * Helper for array and count
   */
  _handleCount: function(key) {

    var reduceFn = function(prefix) {

      prefix = prefix ? prefix + '.' : '';

      return function(result, field, name) {

        if (_.isArray(field)) {
          result[prefix + '_' + name + 'Count'] = field.length;
        }

        else if (_.isPlainObject(field)) {
          _.reduce(field, reduceFn(prefix + name), result);
        }

        return result;
      }
    };

    return reduceFn()({}, this[key], key);
  },

  /**
   * Retrieves the db model
   */
  getDbModel: function() {

    // cache
    if (this.__dbModel) {
      return this.__dbModel;
    }

    var name = this.__info.name;
    var schemaObj = schema.convertToMongoose(this.__info);

    // not initialized
    if (!this.__db) {
      throw new errors.ServerError('Model ' + name + ' not initialized');
    }

    // save to the prototype of the object
    this.__constructor.prototype.__dbModel =
      this.__db.adaptor.connection.model(
        name,
        schemaObj.mongooseSchema
      );

    return this.__dbModel;
  },

  /**
   * Event emitter
   */
  emit: function() {
    this.__eventEmitter.emit.apply(
      this.__eventEmitter,
      arguments
    );
  },
});

/**
 * Builds the class for view model.
 * @param {Object} info The model information
 * @param {Object} def The model definition (fields)
 * @param {Object} create (Optional) The model create definition
 * @return {ViewModel} The constructor to the ViewModel
 */
function constructModelClass(info) {

  // throws err
  validateInfo(info);

  // class definition
  var ViewModelObject = function ViewModel() {
    ViewModelBase.apply(this, arguments); // call base constructor
  };

  // inherit from ViewModelBase
  ViewModelObject.prototype = _.create(ViewModelBase.prototype, {});

  // call base prototype constructor
  initPrototype.call(
    ViewModelObject.prototype,
    ViewModelObject,
    info
  );

  return ViewModelObject;
}

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

  // validate collection
  if (!info.db || !info.db.collection) {
    throw new errors.ServerError(
      'Model generation failure: info.db.collection is required'
    );
  }

  // make sure a type is included and the right type
  var typeValidation = _.omit(info.fields, function(field) {
    return types.isType(field.type) || types.isComplexType(field.type);
  });

  if (_.keys(typeValidation).length > 0) {
    var err = new errors.ServerError(
      'The field definitions of ' + info.name + 'ViewModel' +
      ' is invalid for (' +
      _.reduce(typeValidation, function(fields, field, key) {
        fields += key + ' ';
        return fields;
      }) +
      ')'
    );

    logger.error(err);
    throw err;
  }
}

/**
 * Sets the db connection to the model
 */
function setConnection(db) {
  ViewModelBase.prototype.__db = db;
}

/**
 * Sets the data provider (localization)
 */
function setDataProvider(dataProvider) {
  ViewModelBase.prototype.__dataProvider = dataProvider;
}

module.exports = {
  constructModelClass: constructModelClass,
  setConnection: setConnection,
  setDataProvider: setDataProvider,
};
