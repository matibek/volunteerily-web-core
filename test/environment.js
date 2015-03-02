var core = require('..');
var errors = core.errors;
var expect = require('chai').expect;

describe('Core: environment', function() {

  describe('production', function() {

    it('should consider production alternatives', function() {

      // prepare

      // run
      var result = core.environment.getEnvironment('production-test');

      // result
      expect(result.isRelease).to.equal(true);

    });

  });

});
