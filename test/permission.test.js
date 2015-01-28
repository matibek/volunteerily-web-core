var core = require('..');
var permission = core.permission;
var errors = core.errors;
var should = require('chai').should();

//############################################################################
//############################################################################
describe('Core: permissions', function() {

  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////
  it('should be able to test 1 permission', function() {

    // prepare
    var permissions = {
      one: 1<<1,
    };

    // run
    var code = permission.getPermissionCode(permissions.one);

    // result
    permission.hasPermission(code, permissions.one).should.be.true;
  });

  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////
  it('should be able to test 2 permissions', function() {

    // prepare
    var permissions = {
      one: 1<<1,
      two: 1<<2,
    };

    // run
    var code = permission.getPermissionCode(permissions.one, permissions.two);

    // result
    permission.hasPermission(code, permissions.one).should.be.true;
    permission.hasPermission(code, permissions.two).should.be.true;
  });

  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////
  it('should not have permission', function() {

    // prepare
    var permissions = {
      one: 1<<1,
      two: 1<<2,
    };

    // run
    var code = permission.getPermissionCode(permissions.one);

    // result
    permission.hasPermission(code, permissions.one).should.be.true;
    permission.hasPermission(code, permissions.two).should.be.false;
  });


  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////
  it('should have some permission', function() {

    // prepare
    var permissions = {
      one: 1<<1,
      two: 1<<2,
      three: 1<<3,
    };

    // run
    var user = permission.getPermissionCode(permissions.one, permissions.two);

    // either one or three
    var check =
      permission.getPermissionCode(permissions.one, permissions.three);

    // result
    permission.hasPermission(user, check).should.be.true;
  });

  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////
  it('should not have some permission', function() {

    // prepare
    var permissions = {
      one: 1<<1,
      two: 1<<2,
      three: 1<<3,
      four: 1<<4,
    };

    // run
    var user = permission.getPermissionCode(permissions.one, permissions.two);

    // either one or three
    var check =
      permission.getPermissionCode(permissions.three, permissions.four);

    // result
    permission.hasPermission(user, check).should.be.false;
  });

});
