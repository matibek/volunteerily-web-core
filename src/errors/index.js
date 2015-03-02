var _ = require('lodash');

/**
 * Error definitions
 */
var errors = {

  DbError: {
    code: 200,
    message: 'Unhandled server error',
  },

  ExternalError: {
    code: 300,
    message: 'Error due to third party',
  },

  NotImplemented: {
    code: 101,
    message: 'This functionality is not implemented',
  },

  Validation: {
    code: 102,
    message: 'The parameters passed are invalid',
    clientCode: 400,
  },

  Unauthorized: {
    code: 403,
    message: 'Unauthorized access',
    clientCode: 403,
  },

  NotFound: {
    code: 404,
    message: '',
    clientCode: 404,
  },

  TooManyOperations: {
    code: 405,
    message: 'Too many operations',
    clientCode: 403,
  },
};

/**
 * Base class for ServerErrors
 */
function ServerError() {
  ServerErrorConstructor.apply(this, arguments);
}

/**
 * ServerError constructor
 */
function ServerErrorConstructor(message, innerErr) {
  // allow passing only an innerErr
  if (message instanceof Error) {
    innerErr = message;
    message = undefined;
  }
  else if(_.isObject(message)) {
    var options = message;

    message = options.message;
    innerErr = options.innerErr;

    _.chain(options)
      .omit(options, ['message', 'innerErr'])
      .keys()
      .forEach(function(p) {
        this[p] = options[p];
      }, this);
  }

  // remove the first stack level
  this.stack = this.__name + new Error().stack
    .replace(/(.|\n)*ServerError (.)*\n/, '\n');

  // use the provided message or generic one
  if (message) {
    this.message = message;
  }

  // add innerErr property only if passed to it
  if (innerErr) {
    this.innerErr = innerErr;
  }
}

// inherit from Error
ServerError.prototype = _.create(
  Error.prototype,
  {
    __name: 'ServerError',
    code: 100,
    clientCode: 500,
    message: 'Unhandled server error',
  }
);

/**
 * String representation of the error
 */
ServerError.prototype.toString = function() {
  return this.name + ' (' + this.code + '): ' + this.message;
};

// converts the definition to actual classes and export them
var errorDefinitions = _.transform(errors, function(result, value, name) {

  var ErrorObject = function ServerError() {
    ServerErrorConstructor.apply(this, arguments);
  };

  // inherit from ServerError
  ErrorObject.prototype = _.create(
    ServerError.prototype,
    {
      __name: name,
      code: value.code,
      clientCode: value.clientCode || ServerError.prototype.clientCode,
      message: value.message,
    }
  );

  result[name] = ErrorObject;
});

module.exports = _.merge(errorDefinitions, {
  ServerError: ServerError,
  isMongoDbDuplicateError: function(err) {
    return err.name === 'MongoError' && err.code === 11000;
  },
});
