var core = require('..');
var should = require('chai').should();
var schema = require('../src/model/schema');

describe('Core: events', function() {

  //############################################################################
  //############################################################################
  describe('ListenerObject', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should bind to event', function() {
      // prepare
      var subject = new core.events.ObservableObject();
      var result = 0;

      // run
      var test = new core.events.ObserverObject();
      test.bind(subject, 'test', function() {
        result++;
      });

      test.bind(subject, 'test', function() {
        result++;
      });

      // result
      subject.emit('test', {});
      result.should.equal(2);
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should unbind to event', function() {
      // prepare
      var subject = new core.events.ObservableObject();
      var result = false;

      // run
      var test = new core.events.ObserverObject();

      test.bind(subject, 'test', function() {
        result = true;
      });

      test.unbindAll();

      // result
      subject.emit('test', {});
      result.should.not.be.true;
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should unbind multiple event', function() {
      // prepare
      var subject = new core.events.ObservableObject();
      var result = false;

      // run
      var test = new core.events.ObserverObject();

      test.bind(subject, 'test', function() {
        result = true;
      });

      test.bind(subject, 'test', function() {
        result = true;
      });

      test.unbindAll();

      // result
      subject.emit('test', {});
      result.should.not.be.ok;
    });

  });
});
