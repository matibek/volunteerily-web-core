var path = require('path');

var constants = {
  ENVIRONMENTS: {
    dev: 'dev',
    test: 'test',
    release: 'release',
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
