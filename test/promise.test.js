var _ = require('lodash');
var core = require('..');
var errors = core.errors;
var promise = core.promise;
var should = require('chai').should();

// helper
function nonPromiseFn(value) {
  return value + ' no'
}

function promiseFn(value) {
  var defer = promise.defer();

  _.delay(function() {
    defer.resolve(value + ' yes');
  }, 1)

  return defer;
}

//############################################################################
//############################################################################
describe('Core: promise', function() {

  //############################################################################
  //############################################################################
  describe('promises and non promises', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should be able to handle promise', function(done) {

      // prepare

      // run
      promise.create()
      .then(promiseFn)
      .then(promiseFn)

      // result
      .then(function(result) {

        result.should.equal('undefined yes yes');
      })

      // clean
      .fin(done)
      .end();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should be able to handle non promise functions', function(done) {

      // prepare

      // run
      promise.create()
      .then(nonPromiseFn)
      .then(nonPromiseFn)

      // result
      .then(function(result) {

        result.should.equal('undefined no no');
      })

      // clean
      .fin(done)
      .end();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should be able to handle a combination of non promise with promise functions', function(done) {

      // prepare

      // run
      promise.create()
      .then(nonPromiseFn)
      .then(promiseFn)
      .then(nonPromiseFn)
      .then(nonPromiseFn)
      .then(promiseFn)
      .then(promiseFn)

      // result
      .then(function(result) {
        result.should.equal('undefined no yes no no yes yes');
      })

      // clean
      .fin(done)
      .end();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should be able to handle non returning functions', function(done) {

      // prepare
      var result1;

      // run
      promise.create()
      .then(function() {
        result1 += ' one';
      })
      .then(promiseFn)
      .then(promiseFn)

      // result
      .then(function(result2) {
        result1.should.equal('undefined one');
        result2.should.equal('undefined yes yes')
      })

      // clean
      .fin(done)
      .end();
    });

  });

  //############################################################################
  //############################################################################
  describe('create', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should be able to create with promise', function(done) {

      // prepare

      // run
      promise
      .create(promiseFn)

      // result
      .then(function(result) {
        result.should.equal('undefined yes');
      })

      // clean
      .fin(done)
      .end();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should be able to create non promise function', function(done) {

      // prepare

      // run
      promise
      .create(nonPromiseFn)

      // result
      .then(function(result) {
        result.should.equal('undefined no');
      })

      // clean
      .fin(done)
      .end();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should be able to create with non returning function', function(done) {

      // prepare
      var result1;

      // run
      promise
      .create(function() {
        result1 += ' one';
      })
      .then(nonPromiseFn)
      .then(promiseFn)

      // result
      .then(function(result2) {
        result1.should.equal('undefined one');
        result2.should.equal('undefined no yes');
      })

      // clean
      .fin(done)
      .end();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should be able to create with initial promise', function(done) {

      // prepare
      var result1 = 'initial';

      // run
      promise
      .create(result1)
      .then(nonPromiseFn)
      .then(promiseFn)

      // result
      .then(function(result) {
        result.should.equal('initial no yes');
      })

      // clean
      .fin(done)
      .end();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should be able to create with initial value', function(done) {

      // prepare
      var promiseObj = promiseFn('initial');

      // run
      promise
      .create(promiseObj)
      .then(nonPromiseFn)
      .then(promiseFn)

      // result
      .then(function(result) {
        result.should.equal('initial yes no yes');
      })

      // clean
      .fin(done)
      .end();
    });

  });
});
