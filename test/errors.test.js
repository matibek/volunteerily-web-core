var core = require('..');
var errors = core.errors;
var should = require('chai').should();

describe('Core: errors', function() {

  describe('type testing', function() {

    it('should have different types for different errors', function() {
      (new errors.DbError() instanceof errors.NotImplemented).should.not.be.ok;
    });

    it('should have same types for same errors', function() {
      (new errors.DbError() instanceof errors.DbError).should.be.ok;
    });

    it('should be able to compare with base errors', function() {
      (new errors.DbError() instanceof errors.ServerError).should.be.ok;
    });

    it('should be an Error', function() {
      (new errors.DbError() instanceof Error).should.be.ok;
    });

    it('should be able to build with options', function() {
      // prepare
      var message = 'testMessage';
      var innerErr = new Error();
      var custom = 'custom';

      // run
      var test = new errors.DbError({
        message: message,
        innerErr: innerErr,
        custom: custom,
      });

      // result
      test.should.have.property('message', message);
      test.should.have.property('innerErr', innerErr);
      test.should.have.property('custom', custom);
    });
  });

});
