var path = require('path');

var constants = {
  ENVIRONMENTS: {
    debug: 'debug',
    dev: 'development', // standard name
    test: 'test',
    release: 'production', // standard name
  },

  SAMPLE: {
    org: {
      _id: '5435e47000455beefbadbeef',
      name: 'Volunteerily - test organization',
      email: 'bill@volunteerily.com',
      admins: [],
      url: 'http://volunteerily.com',
      description: 'This organization is not a real organization. \
      It is only used for demo purposes only.',
      status: {
        verified: true,
      },
    },
  },
};

module.exports = constants;
