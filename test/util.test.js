var _ = require('lodash');
var core = require('..');
var expect = require('chai').expect;

describe('Core: util', function() {

  //############################################################################
  //############################################################################
  describe('object.get', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should succeed with dotNotation', function() {
      // prepare
      var test = {
        one: {
          two: {
            three: 'test',
          }
        }
      };

      // run
      var result = core.util.object.get(test, 'one.two.three')

      // result
      expect(result).to.be.equal(test.one.two.three);
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should get null on wrong dotNotation', function() {
      // prepare
      var test = {
        one: {
          two: {
            three: 'test',
          }
        }
      };

      // run
      var result = core.util.object.get(test, 'one.two.three.four')

      // result
      expect(result).to.not.be.ok();
    });
  });

  //############################################################################
  //############################################################################
  describe('object.set', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should succeed with dotNotation', function() {
      // prepare
      var test = {
        one: {
          two: {
            three: 'test',
          }
        }
      };

      // run
      core.util.object.set(test, 'one.two.three', 'new')

      // result
      expect(test.one.two.three).to.be.equal('new');
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should add value when not originally there', function() {
      // prepare
      var test = {
        one: {
          two: {
          }
        }
      };

      // run
      core.util.object.set(test, 'one.two.three.four', 'new')

      // result
      expect(test.one.two.three).to.have.property('four', 'new');
    });
  });

});
