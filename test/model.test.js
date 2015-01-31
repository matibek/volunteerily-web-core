var core = require('..');
var expect = require('chai').expect;
var model = require('../src/model');
var schema = require('../src/model/schema');
var should = require('chai').should();
var testUtil = require('./util');

describe('Core: model', function() {

  before(function(done) {
    testUtil.run([
      'db-connect',
    ],
      done
    );
  });

  after(function(done) {
    testUtil.run([
      'db-disconnect',
    ],
      done
    );
  });

  beforeEach(function(done) {
    testUtil.run([
      'db-clean',
    ],
      done
    );
  });

  //############################################################################
  //############################################################################
  describe('ViewModel', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should build a ViewModel with the right types and values', function() {
      // prepare
      var info = {
        name: 'Test1',
        db: { collection: 'tests', },
        fields: {
          testString: { type: model.types.string, },
          testString2: { type: model.types.string, },
          testNumber: { type: model.types.number, },
          testNumber2: { type: model.types.number, },
        },
      };

      var ViewModelClass = model.constructModel(info).ViewModel;

      // run
      var viewModel = new ViewModelClass({
        data: {
          testString2: 'test',
          testNumber2: 999,
        },
      });

      // result
      viewModel.should.not.have.property('testString');
      viewModel.should.have.property('testString2', 'test');
      viewModel.should.not.have.property('testNumber');
      viewModel.should.have.property('testNumber2', 999);

    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it.skip('should not allow constructing with the wrong type', function() {
      // prepare
      var info = {
        name: 'Test2',
        db: { collection: 'tests', },
        fields: {
          test: { type: model.types.number, },
        },
      };

      var ViewModelClass = model.constructModel(info).ViewModel;

      // result
      (function() {
        new ViewModelClass({ data: { test: 'a string instead of a number', }, });
      })
        .should
        .throw(core.errors.ServerError);
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should build all fields even on empty param', function() {
      // prepare
      var info = {
        name: 'Test1_1',
        db: {
          collection: 'tests',
        },

        fields: {
          test: { type: model.types.string, }
        }
      };

      var ViewModelClass = model
        .constructModel(info)
        .ViewModel;

      // run
      var result = new ViewModelClass({data: { test: '', }, });

      // result
      result.should.have.property('test', '');
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should fail when no name is passed', function() {
      // prepare
      var info = {
        fields: {
          test: { type: model.types.number, },
        },
      };

      // result
      (function() {
        var ViewModelClass = model.constructModel(info).ViewModel;
      })
        .should
        .throw(core.errors.ServerError);
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should fail when the type is invalid', function() {
      // prepare
      var info = {
        name: 'Test3',
        db: {
          collection: 'tests',
        },
        fields: {
          test: 123,
        },
      };

      // run
      (function() {
        var ViewModelClass = model.constructModel(info).ViewModel;
      })
        .should
        .throw(core.errors.ServerError);
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should not fail on success validation', function() {
      // prepare
      var info = {
        name: 'Test4',
        db: {
          collection: 'tests',
        },
        fields: {
          test: { type: model.types.string, }
        },
        create: {
          test: {
            validators: {
              size: {
                range: [0, 5],
                message: 'Should be between 0 and 5',
              }
            },
          },
        },
      };

      var ViewModelClass = model
        .constructModel(info)
        .ViewModel;

      // run (should not throw)
      (function() {
        new ViewModelClass({ data: { test: 'shrt', }, });
      })
        .should
        .not
        .throw;
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should fail on failed validation', function() {
      // prepare
      var info = {
        name: 'Test5',
        db: {
          collection: 'tests',
        },

        fields: {
          test: { type: model.types.string, }
        },

        create: {
          test: {
            validators: {
              size: {
                range: [0, 5],
                message: 'Should be between 0 and 5',
              }
            },
          },
        },
      };

      var ViewModelClass = model
        .constructModel(info)
        .ViewModel;

      // run
      (function() {
        (new ViewModelClass({ data: { test: 'too long, should fail', }, })).validate();
      })
        .should
        .throw(core.errors.ValidationError);
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should transform the ViewModel', function() {
      // prepare
      var info = {
        name: 'Test10',
        db: {
          collection: 'tests',
        },
        fields: {
          test: { type: model.types.string, }
        },
        create: {
          test: {
            transform: function(value) {
              return value + 'transformed';
            },
          },
        },
      };

      var ViewModelClass = model
        .constructModel(info)
        .ViewModel;

      // run
      var result = new ViewModelClass({ data: { test: 'original', }, transform: true, });

      // result
      result.should.have.property('test', 'originaltransformed');

    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should build an array with the count helper', function() {
      // prepare
      var info = {
        name: 'Test12',
        db: {
          collection: 'tests',
        },
        fields: {
          test: { type: [model.types.string], }
        },
      };

      var viewModel = model
        .constructModel(info);

      // run
      var result = new viewModel.ViewModel({
        data: { test: ['one', 'two'], },
        transform: true,
        default: true,
      });

      // result
      result.should.have.property('test').with.length(2);
      result.test[0].should.equal('one');
      result.test[1].should.equal('two');

      // count helper
      viewModel.info.fields.should.have.property('_testCount');
      result.should.have.property('_testCount', 2);
    });

  });

  //############################################################################
  //############################################################################
  describe('schema', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should build simple object', function() {
      // prepare
      var info = {
        name: 'Test6',

        db: {
          collection: 'tests',
        },

        fields: {
          test: {
            type: model.types.string
          },
          testNumber: {
            type: model.types.number
          },
        },
      };

      // run
      var result = schema.convertToMongoose(info);

      // result
      result.schema.should.be.eql({
        test: String,
        testNumber: Number,
      });
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should build complex object', function() {
      // prepare
      var info = {
        name: 'Test7',

        db: {
          collection: 'tests',
        },

        fields: {
          test: {
            type: {
              level1: model.types.string,
              level1Complex: {
                level2: model.types.string,
              },
            },
          },
        },
      };

      // run
      var result = schema.convertToMongoose(info);

      // result
      result.schema.should.be.eql({
        test: {
          level1: String,
          level1Complex: {
            level2: String,
          }
        }
      });
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should build array of simple objects', function() {
      // prepare
      var info = {
        name: 'Test8',

        db: {
          collection: 'tests',
        },

        fields: {
          test: {
            type: [model.types.string],
          },
        },
      };

      // run
      var result = schema.convertToMongoose(info);

      // result
      result.schema.should.be.eql({
        test: [String],
      });
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should build array of complex objects', function() {
      // prepare
      var info = {
        name: 'Test9',

        db: {
          collection: 'tests',
        },

        fields: {
          test: {
            type: [{
              level1: model.types.string,
              level1Complex: [{
                level2: model.types.string,
              }],
            }],
          },
        },
      };

      // run
      var result = schema.convertToMongoose(info);

      // result
      result.schema.should.be.eql({
        test: [{
          level1: String,
          level1Complex: [{
            level2: String,
          }]
        }],
      });
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should build mixed object', function() {
      // prepare
      var info = {
        name: 'Test11',

        db: {
          collection: 'tests',
        },

        fields: {
          test: {
            type: {
              mixed: model.types.mixed,
            },
          },
        },
      };

      // run
      var result = schema.convertToMongoose(info);

      // result
      result.schema.should.be.eql({
        test: {
          mixed: model.types.mixed.db,
        }
      });
    });

  });

  //############################################################################
  //############################################################################
  describe('Types', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should return localized default fields', function(done) {

      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'fixture',

            db: {
              collection: 'fixture',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              localized: {
                type: model.types.localized,
              },
            },

            data: {
              localized: {
                en: 'english', // default
                ko: 'korean',
                cn: 'chinese',
              },
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.findById(db.data._id);
        })

      // result
        .then(function(result) {
          expect(result).to.have.property('localized', 'english');
        })

      // clean
        .fin(done)
        .done();

    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should return localized fields', function(done) {

      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'fixture2',

            db: {
              collection: 'fixture',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              localized: {
                type: model.types.localized,
              },
            },

            data: {
              localized: {
                default: 'default',
                en: 'english',
                ko: 'korean',
                cn: 'chinese',
              },
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.findById(db.data._id, { localize: 'ko', });
        })

      // result
        .then(function(result) {
          expect(result).to.have.property('localized', 'korean');
        })

      // clean
        .fin(done)
        .done();

    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should return all localized', function(done) {

      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'fixture3',

            db: {
              collection: 'fixture',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              localized: {
                type: model.types.localized,
              },
            },

            data: {
              localized: {
                en: 'english',
                ko: 'korean',
                cn: 'chinese',
              },
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.findById(db.data._id, { localize: false, });
        })

      // result
        .then(function(result) {
          expect(result).to.have.property('localized').and.eql({
            en: 'english',
            ko: 'korean',
            cn: 'chinese',
          });
        })

      // clean
        .fin(done)
        .done();

    });

  });

  //############################################################################
  //############################################################################
  describe('Validation', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should validate', function() {
      // prepare
      var info = {
        name: 'Test1_57',

        db: {
          collection: 'tests',
        },

        fields: {
          test: {
            type: model.types.string,
          },
        },

        create: {
          test: {
            validators: {
              size: {
                range: [5, 20],
                message: 'should be between 5 and 20 characters',
              },
            },
          },
        },
      };

      var ViewModelClass = model
        .constructModel(info)
        .ViewModel;

      // run
      var result = new ViewModelClass({data: {
        test: 'more than 5',
      }});

      result.validate();

      // result
      expect(result).to.have.property('test');
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should validate localized fields', function() {
      // prepare
      var info = {
        name: 'Test1_56',

        db: {
          collection: 'tests',
        },

        fields: {
          test: {
            type: model.types.localized,
          },
        },

        create: {
          test: {
            validators: {
              size: {
                range: [5, 20],
                message: 'The alias should be between 5 and 20 characters',
              },
            },
          },
        },
      };

      var ViewModelClass = model
        .constructModel(info)
        .ViewModel;

      // run
      var result = new ViewModelClass({
        data: {
          test: {
            en: 'more than 5',
            ko: 'more than 5',
          },
        },
      });

      result.validate();

      // result
      expect(result).to.have.property('test');

    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should fail when one localized fields fails', function() {
      // prepare
      var info = {
        name: 'Test1_59',

        db: {
          collection: 'tests',
        },

        fields: {
          test: {
            type: model.types.localized,
          },
        },

        create: {
          test: {
            validators: {
              size: {
                range: [5, 20],
                message: 'The alias should be between 5 and 20 characters',
              },
            },
          },
        },
      };

      var ViewModelClass = model
        .constructModel(info)
        .ViewModel;

      // run
      var result = new ViewModelClass({
        data: {
          test: {
            en: 'more than 5',
            ko: '1',
          },
        },
      });

      (function() {
        result.validate();
      })

      // result
        .should
        .throw(core.errors.ValidationError);
    });
  });

  //############################################################################
  //############################################################################
  describe('DB', function() {

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should update', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbUpdate',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              test: {
                type: model.types.string,
              },
            },

            data: {
              test: 'test',
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.update(db.data._id, { test: 'test2', });
        })

      // result
        .then(function(result) {
          expect(result).to.have.property('test', 'test2');
        })

      // clean
        .fin(done)
        .done();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should update on complex id', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbUpdate2',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              id2: {
                type: model.types.id,
              },
              test: {
                type: model.types.string,
              },
            },

            data: {
              test: 'test',
              id2: '5435e47000badbaddeadbeef',
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.update(
            {
              _id: db.data._id,
              id2: db.data.id2,
            },
            { test: 'test2', }
          );
        })

      // result
        .then(function(result) {
          expect(result).to.have.property('test', 'test2');
        })

      // clean
        .fin(done)
        .done();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should not update on incomplete complex id', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbUpdate3',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              id2: {
                type: model.types.id,
              },
              test: {
                type: model.types.string,
              },
            },

            data: {
              test: 'test',
              id2: '5435e47000badbaddeadbeef',
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.update(
            {
              _id: db.data._id,
              id2: '5435e47000badbaddeadbeee', // missmatch
            },
            { test: 'test2', }
          );
        })

      // result
        .then(function(result) {
          expect(result).to.not.be.ok();
        })

      // clean
        .fin(done)
        .done();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should update status', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbUpdateStatus',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              status: {
                type: model.types.mixed,
              },
            },

            data: {
              status: {
                test: 'test',
              },
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.updateStatus(
            db.data._id,
            'test2',
            'test2'
          );
        })

      // result
        .then(function(result) {
          expect(result).to.have.property('status');
          expect(result.status).to.eql({ test: 'test', test2: 'test2', });
        })

      // clean
        .fin(done)
        .done();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should push update', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbUpdatePush',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              test: {
                type: [model.types.mixed],
              },
            },

            data: {
              test: [{
                test: 'test',
              }],
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.updatePush(
            db.data._id,
            'test',
            { test: 'test2', }
          );
        })

      // result
        .then(function(result) {
          expect(result).to.have.property('test').with.length(2);
          expect(result).to.have.property('_testCount', 2);
        })

      // clean
        .fin(done)
        .done();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should push update on complex id', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbUpdatePush2',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              id2: {
                type: model.types.id,
              },
              test: {
                type: [model.types.mixed],
              },
            },

            data: {
              id2: '5435e47000badbaddeadbeef',
              test: [{
                test: 'test',
              }],
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.updatePush(
            {
              _id: db.data._id,
              id2: db.data.id2,
            },
            'test',
            { test: 'test2', }
          );
        })

      // result
        .then(function(result) {
          expect(result).to.have.property('test').with.length(2);
          expect(result).to.have.property('_testCount', 2);
        })

      // clean
        .fin(done)
        .done();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should fail push update on incomplete complex id', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbUpdatePush3',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              id2: {
                type: model.types.id,
              },
              test: {
                type: [model.types.mixed],
              },
            },

            data: {
              id2: '5435e47000badbaddeadbeef',
              test: [{
                test: 'test',
              }],
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.updatePush(
            {
              _id: db.data._id,
              id2: '5435e47000badbaddeadbeee',
            },
            'test',
            { test: 'test2', }
          );
        })

      // result
        .then(function(result) {
          expect(result).not.be.ok();
        })

      // clean
        .fin(done)
        .done();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should pull update', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbUpdatePull',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              test: {
                type: [model.types.mixed],
              },
            },

            data: {
              test: [{
                _id: '5435e47000badbaddeadbeef',
                test: 'test',
              }, {
                _id: '5435e47000badbaddeadbeee',
                test: 'test',
              }],
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.updatePull(
            db.data._id,
            'test',
            { _id: '5435e47000badbaddeadbeee', }
          );
        })

      // result
        .then(function(result) {
          expect(result).to.have.property('test').with.length(1);
          expect(result).to.have.property('_testCount', 1);
        })

      // clean
        .fin(done)
        .done();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should pull update on complex id', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbUpdatePull2',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              id2: {
                type: model.types.id,
              },
              test: {
                type: [model.types.mixed],
              },
            },

            data: {
              id2: '5435e47000badbaddeadbeea',
              test: [{
                _id: '5435e47000badbaddeadbeef',
                test: 'test',
              }, {
                _id: '5435e47000badbaddeadbeee',
                test: 'test',
              }],
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.updatePull(
            {
              _id: db.data._id,
              id2: '5435e47000badbaddeadbeea',
            },
            'test',
            { _id: '5435e47000badbaddeadbeee', }
          );
        })

      // result
        .then(function(result) {
          expect(result).to.have.property('test').with.length(1);
          expect(result).to.have.property('_testCount', 1);
        })

      // clean
        .fin(done)
        .done();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should fail pull update on incomplete complex id', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbUpdatePull3',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              id2: {
                type: model.types.id,
              },
              test: {
                type: [model.types.mixed],
              },
            },

            data: {
              id2: '5435e47000badbaddeadbeea',
              test: [{
                _id: '5435e47000badbaddeadbeef',
                test: 'test',
              }, {
                _id: '5435e47000badbaddeadbeee',
                test: 'test',
              }],
            },
          });
        })

      // run
        .then(function(db) {
          return db.viewModel.updatePull(
            {
              _id: db.data._id,
              id2: '5435e47000badbaddeadbeeb',
            },
            'test',
            { _id: '5435e47000badbaddeadbeee', }
          );
        })

      // result
        .then(function(result) {
          expect(result).not.be.ok();
        })

      // clean
        .fin(done)
        .done();
    });

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    it('should delete all', function(done) {
      // prepare
      core.promise.create()
        .then(function() {
          return testUtil.db.prepareDb({

            name: 'dbDelete',

            db: {
              collection: 'tests',
              write: true,
            },

            fields: {
              _id: {
                type: model.types.id,
              },
              test: {
                type: model.types.string,
              },
            },
          });
        })

        .then(function(db) {
          return core.promise.all([
            db,
            db.viewModel.create({ test: '', }),
            db.viewModel.create({ test: '', }),
            db.viewModel.create({ test: '', }),
          ]);
        })

      // run
        .then(function(result) {
          var db = result[0];

          return core.promise.all([
            db,
            db.viewModel.deleteAll(),
          ]);
        })

      // result
        .then(function(result) {
          var db = result[0];

          return db.viewModel.find();
        })
        .then(function(result){
          expect(result).to.have.length(0);
        })

      // clean
        .fin(done)
        .done();
    });
  });
});
