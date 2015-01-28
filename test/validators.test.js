var core = require('..');
var should = require('chai').should();
var validator = require('../src/model/validators');
var _ = require('lodash');

describe('Core: validators', function() {

  //############################################################################
  //############################################################################
  describe('size', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should fail on lower range check', function() {
      // prepare
      var validators = {
        size: {
          range: [10, 20],
        },
      };

      // run
      var result = validator.validate(validators, 9);

      // result
      result.should.have.property('size');
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should fail on higher size check', function() {
      // prepare
      var validators = {
        size: {
          range: [10, 20],
        },
      };

      // run
      var result = validator.validate(validators, 21);

      // result
      result.should.have.property('size');
    });
  });

  //############################################################################
  //############################################################################
  describe('regex', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should pass valid url', function() {
      // prepare
      var validators = {
        regex: {
          regex: core.regex.url,
        },
      };

      _.chain([
        'http://volunteerily.com',
        'https://volunteerily.com',
        'http://www.volunteerily.com',
        'https://www.volunteerily.com',
        'http://debug.volunteerily.com',
        'http://volunteerily.com/one/two',
      ]).forEach(function(url) {

        // run
        var result = validator.validate(validators, url);

        // result
        result.should.not.have.property('regex');
      });
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should fail on invalid url', function() {
      // prepare
      var validators = {
        regex: {
          regex: core.regex.url,
        },
      };

      _.chain([
        'volunteerily.com',
        'www.volunteerily.com',
        'htp://volunteerily.com',
        'ftp://volunteerily.com',
      ]).forEach(function(url) {

        // run
        var result = validator.validate(validators, url);

        // result
        result.should.have.property('regex');
      });
    });

  });

  //############################################################################
  //############################################################################
  describe('number', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should validate numbers', function() {
      // prepare
      var validators = {
        number: {},
      };

      _.chain([
        '0',
        '10',
        '99999999999',
      ]).forEach(function(url) {

        // run
        var result = validator.validate(validators, url);

        // result
        result.should.not.have.property('number');
      });
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should fail on invalid number', function() {
      // prepare
      var validators = {
        number: {},
      };

      _.chain([
        'a',
        'a1',
      ]).forEach(function(url) {

        // run
        var result = validator.validate(validators, url);

        // result
        result.should.have.property('number');
      });
    });

  });
});
