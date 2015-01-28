var crypto = require('crypto');
var cryptkey = new Buffer([0x37,0xDE,0x22,0xC8,0x7E,0x90,0x36,0xB1,0xD4,0x9B,0xC0,0x09,0x7F,0x31,0x8B,0xF3,0xD8,0x22,0x3B,0x43,0x57,0x04,0xF0,0x13,0x6F,0xBC,0xE6,0x94,0xCE,0xBE,0xC2,0x0F]);
var iv = new Buffer([0xA6,0x67,0x5D,0x7A,0xF9,0xFC,0x1B,0x37,0x12,0xE2,0xB6,0x84,0x93,0x86,0x40,0xC9]);
var bcrypt = require('bcrypt');

var EncryptAES = function(plain){
  var cipher = crypto.createCipheriv('aes256', cryptkey, iv);
  var p = String(plain);
  while(p.length%32!==0) {
    p+=' ';
  }

  return cipher.update(p, 'utf8', 'hex')+cipher.final('hex');
}

var DecryptAES = function(enc){
  var decipher = crypto.createDecipheriv('aes256', cryptkey, iv);
  var ret = decipher.update(enc, 'hex', 'utf8')+decipher.final('utf8');
  return ret.replace(/ +$/g,'');
}

var BcryptHash = function(str){
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(str, salt);
}

var BcryptCompare = function(str,hash){
  return bcrypt.compareSync(str, hash);
}

module.exports = {
  EncryptAES : EncryptAES,
  DecryptAES : DecryptAES,
  BcryptHash : BcryptHash,
  BcryptCompare : BcryptCompare
};
