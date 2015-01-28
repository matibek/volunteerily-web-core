var _ = require('lodash');
var core = require('..');
var should = require('chai').should();
var path = require('path');
var validator = require('../src/model/validators');

describe('Core: template', function() {

  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  it('should replace with model', function(done) {
    // prepare
    var model = { two: 'two', four: 'four', };

    // run
    core.promise
    .create(core.template.render(
      path.join(__dirname, 'fixture/template.dot'),
      model
    ))

    // result
    .then(function(result) {
      result.should.equal('one two three four\n');
    })

    // clean
    .fin(done)
    .end();

  });

});
