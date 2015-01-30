var _ = require('lodash');
var promise = require('../promise');
var types = require('./types');
var util = require('../util');
var viewModelBase = require('./base');

/**
 * Builds the model
 */
function constructModel(info) {

  // dynamically build the model class
  var ViewModel = viewModelBase.constructModelClass(info);

  return {

    /**
     * The name of the view model
     */
    name: ViewModel.prototype.__name,

    /**
     * The model constructor
     */
    ViewModel: ViewModel,

    /**
     * The schema used for creating a new model
     */
    createSchema: info.create,

    /**
     * Info of the model
     */
    info: info,

    /**
     * Finds a model by ID.
     */
    findById: function(id, options) {
      return ViewModel.prototype.findById(id, options);
    },

    /**
     * Finds a model given criterias.
     */
    find: function(options) {
      return ViewModel.prototype.find(options);
    },

    /**
     * Creates a model given an optional id.
     */
    create: function(fields, id) {
      return new ViewModel({ data: fields, transform: true, default: true, })
        .validate()
        .create(id);
    },

    /**
     * Deletes a model by id
     */
    deleteById: function(id) {
      return ViewModel.prototype.deleteById(id);
    },

    /**
     * Updates a model given the updated fields.
     */
    update: function(id, fields, options) {

      assert(fields, 'Expected some changes');

      // support multiple id
      var find = null;
      if (_.isPlainObject(id)) {
        find = id;
        id = id._id || '';
      }

      // put the id in
      fields._id = id;

      var result = new ViewModel({ data: fields, transform: true, });

      if (options && options.validate) {
        result.validate(true); // only validate fields that are present
      }

      return result.update(find);
    },

    /**
     * Updates a status
     */
    updateStatus: function() {
      return ViewModel.prototype.updateStatus.apply(
        ViewModel.prototype,
        arguments
      );
    },

    /**
     * Pushes a data to a field (array)
     */
    updatePush: function(id, field, data) {
      assert(id, 'Expected an id');
      assert(field, 'Expected a field');
      assert(data, 'Expected data');

      var push = {};
      push[field] = data;

      var inc = {};
      inc['_' + field + 'Count'] = 1;

      // support multiple id
      var find = _.isPlainObject(id) ? id : { _id: id, };

      return ViewModel.prototype._update.call(
        ViewModel.prototype,
        find,
        {
          $push: push,
          $inc: inc,
        }
      );
    },

    /**
     * Pulls a data to a field (array)
     */
    updatePull: function(id, field, data) {
      assert(id, 'Expected an id');
      assert(field, 'Expected a field');
      assert(data, 'Expected data');

      var pull = {};
      pull[field] = data;

      var inc = {};
      inc['_' + field + 'Count'] = -1;

      // support multiple id
      var find = _.isPlainObject(id) ? id : { _id: id, };

      return ViewModel.prototype._update.call(
        ViewModel.prototype,
        find,
        {
          $pull: pull,
          $inc: inc,
        }
      );
    },

    /**
     * Increments a field
     */
    updateInc: function(id, field, amount) {
      assert(id, 'Expected an id');
      assert(field, 'Expected a field');

      var inc = {};
      inc[field] = amount || 1;

      var dbModel = this.getDbModel();
      return promise.nfcall(dbModel.update.bind(dbModel),
        { _id: id, },
        {
          $inc: inc,
        }
      );
    },

    push: function() {
      logger.warning('Deprecated: call updatePush instead');
      return this.updatePush.apply(this, arguments);
    },

    /**
     * Creates a sample model
     */
    sample: function() {
      return ViewModel.prototype.sample.apply(ViewModel.prototype, arguments);
    },

    /**
     * Gets the db model for db operations
     */
    getDbModel: function() {
      return ViewModel.prototype.getDbModel.call(ViewModel.prototype);
    },

    /**
     * Event binding of the model
     */
    addListener: function() {
      ViewModel.prototype.__eventEmitter.addListener.apply(
        ViewModel.prototype.__eventEmitter,
        arguments
      );

      return this; // chaining
    },

    /**
     * Event unbinding of the model
     */
    removeListener: function() {
      ViewModel.prototype.__eventEmitter.removeListener.apply(
        ViewModel.prototype.__eventEmitter,
        arguments
      );

      return this; // chaining
    },

    /**
     * Event emission for the model
     */
    emit: function() {
      ViewModel.prototype.__eventEmitter.emit.apply(
        ViewModel.prototype.__eventEmitter,
        arguments
      );

      return this; // chaining
    },
  };
}

module.exports = {
  constructModel: constructModel,
  types: types,
  setConnection: viewModelBase.setConnection,
};
