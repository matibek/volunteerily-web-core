var constants = require('../../constants');
var moment = require('moment');
var types = require('./types');
var util = require('../util');
var _ = require('lodash');

var map = {
  title: [
    'Dance with seniors', 'Read for the blinds', 'Teach English',
    'Clean the mountains', 'Gift wrapping', 'Cook for the homeless',
    'Sing with the teens', 'Be a big brother or big sister',
    'Hang out with cancer patients', 'Walk the dogs at the shelter',
    'Gardening at the garden center', 'Food distribution for the holidays',
    'Build houses for earthquake victims', 'Be a city tour guide',
  ],

  /*jshint ignore:start,-W101*/
  description: '' + '\
  Volunteers needed to serve as a Dinner & Discussion Chef. Dinner & Discussion happens every Monday evening, drawing a crowd of from 8 to 20 people. It is intended as a space for members to gather and socialize, to share and learn together. The evening’s meal is planned and prepared by a volunteer chef with support from members. Clean-up is done communally, after which members and volunteers gather for a discussion or activity on a variety of topics presented each week by a guest facilitator. \n\
\n\
#Responsibilities\n\
- plan a healthy, balanced meal with a vegetarian option for roughly 8 to 20 people\n\
- respect given budget\n\
- liaise with a volunteer driver for the purchase and delivery of ingredients\n\
- plan ways for volunteers and members to help cook the meal\n\
- eat with the group\n\
- help tidy the kitchen and dining area after the meal\n\
- stay for the activity (optional) and perform other tasks assigned by supervisor. \n\
\n\
# Requirements\n\
- experience cooking for groups\n\
- ability to work autonomously and in a team\n\
- bilingualism is an asset\n\
\n\
# Training\n\
Volunteer orientation is mandatory for all volunteers and consists of two eight-hour days over the course of a weekend.\n\
\n\
# Great for\n\
- Teenagers (16+)\n\
- Seniors\n\
\n\
# Contact\n\
Norman Ernest Borlaug, Volunteer Coordinator\n\
\n\
- test@email.com\n\
- 123-456-7890\n\
',
  /*jshint ignore:end,-W101*/

  geo: {
    lat: '45.5259253',
    lon: '-73.59869909999998',
  },

  place: {
    country: 'ca',
    city: 'montreal'
  },

  // place: [{
  //   country: 'ca',
  //   city: 'montreal'
  // }, {
  //   country: 'us',
  //   city: 'los angeles'
  // }, {
  //   country: 'np',
  //   city: 'kathmandu'
  // }, {
  //   country: 'gb',
  //   city: 'london'
  // }, {
  //   country: 'cn',
  //   city: 'shanghai'
  // }, {
  //   country: 'za',
  //   city: 'cape town'
  // }, {
  //   country: 'in',
  //   city: 'new delhi',
  // }, {
  //   country: 'de',
  //   city: 'Berlin',
  // }, {
  //   country: 'jp',
  //   city: 'tokyo',
  // }, {
  //   country: 'ru',
  //   city: 'moscow',
  // }, {
  //   country: 'hk',
  //   city: 'hong kong',
  // }, {
  //   country: 'au',
  //   city: 'melbourne',
  // }, {
  //   country: 'kr',
  //   city: 'seoul',
  // }, {
  //   country: 'br',
  //   city: 'rio de janeiro',
  // },],

  creator: {
    _id: '542b7203569116aab7da2c75',
    name: 'Dan Le Van'
  },

  org: constants.SAMPLE.org,

  guests: [[]],

  admins: [[]],

  posts: [[]],

  phone: '+1 514-987-6543',

  url: 'http://volunteerily.com',

  email: 'test@volunteerily.com',

  causes: [['test']],

  schedule: function() {
    var start = moment()
      .add(_.sample([0,1,2,3,4,5,6,7]), 'days')
      .add(_.sample([0,1,2,3,4,5,6,7]), 'hours')
      .startOf('hour');

    var end = start.clone()
      .add(_.sample([30,60,90,120,150,180]), 'minutes');

    return {
      start: start.toDate(),
      end: end.toDate(),
    };
  },
};

function getGenericSample(name, type) {
  if (types.isType(type)) {
    return type.sample;
  }

  if (_.isArray(type)) {
    return _.times(
      _.sample([0,1,2]),
      _.partial(getSample, name, type[0])
    );
  }

  return _.transform(type, function(result, val, key) {
    result[key] = getSample(key, val);
  });
}

function getSample(name, value) {

  var sample = null;
  var type = value.type;

  // specific sample
  if (_.has(value, 'sample') || _.isFunction(value.sample)) {
    sample = value.sample;
  }
  else if (_.has(map, name)) {
    sample = map[name];
  }

  if (_.isFunction(sample)) {
    sample = sample();
  }

  else if (_.isArray(sample)) {
    sample = _.sample(sample);
  }

  // build a generic sample
  else {
    sample = getGenericSample(name, type);
  }

  return sample;
}

module.exports = {
  getSample: getSample,
};
