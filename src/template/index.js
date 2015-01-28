var engine = require('express-dot-engine');
var promise = require('../promise');

var api = {

  render: function(path, model) {
    return promise.nfcall(
      engine.__express,
      path,
      model
    );
  },

};

module.exports = api;
