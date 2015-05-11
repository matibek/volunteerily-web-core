var _ = require('lodash');
var Db = require('../src/db');
var promise = require('../src/promise');
var should = require('chai').should();

describe('Model: DB', function() {

  //############################################################################
  //############################################################################
  describe('Connection', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should connect', function(done) {

      // prepare

      // run
      promise.create()
        .then(function() {
          return new Db()
            .init({ connectionString: 'mongodb://localhost/test', })
            .on('error', function(err) {
              throw err;
            })
            .on('reconnected', function() {
              logger.test('Model DB (mongo) reconnected.');
            })
            .on('close', function() {
              logger.test('Model DB (mongo) connection closed.');
            })
            .connect();
        })

      // result
        .then(function(connection) {
        })

      // clean
        .fail(function(err) { throw err; })
        .fin(done)
        .done();

    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should disconnect', function(done) {

      // prepare

      // run
      promise.create()
        .then(function() {
          return new Db()
            .init({ connectionString: 'mongodb://localhost/test', })
            .on('error', function(err) {
              throw err;
            })
            .on('close', function() {
              done();
            })
            .connect();
        })

      // result
        .then(function(connection) {
          return connection.disconnect();
        })

      // clean
        .fail(function(err) { throw err; })
        .done();

    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should not disconnect twice', function(done) {

      // prepare
      var count = 0;

      // run
      promise.create()
        .then(function() {
          return new Db()
            .init({ connectionString: 'mongodb://localhost/test', })
            .on('error', function(err) {
              throw err;
            })
            .on('close', function() {
              count++;
              count.should.be.equal(1);
            })
            .connect();
        })

      // result
        .then(function(connection) {
          return connection.disconnect();
        })
        .then(function(connection) {
          return connection.disconnect();
        })

      // clean
        .then(function() {
          done();
        })
        .fail(function(err) { throw err; })
        .done();

    });

  });
});
