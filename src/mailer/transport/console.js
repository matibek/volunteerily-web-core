var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var utillib = require('util');

function ConsoleTransport(options) {
  EventEmitter.call(this);

  this.options = options || {};
  this.name = 'Console';
}

ConsoleTransport.prototype = _.create(EventEmitter.prototype, {

  /**
   * Sends a mail
   */
  send: function send(mail, callback) {

    var message = mail.message.createReadStream();
    var chunks = [];
    var chunklen = 0;

    message.on('data', function(chunk) {
      chunks.push(chunk);
      chunklen += chunk.length;
    }.bind(this));

    message.on('end', function() {
      logger.debug(
        'Mail sent\n',
        'from: ' + mail.message.getHeader('from') + '\n',
        'to: ' + mail.message.getHeader('to') + '\n',
        'subject: ' + mail.message.getHeader('subject') + '\n',
        mail.message.content + '\n'
      );

      setImmediate(function() {
        callback(null, {
         envelope: mail.data.envelope || mail.message.getEnvelope(),
         messageId: (mail.message.getHeader('message-id') || '')
          .replace(/[<>\s]/g, ''),
         response: Buffer.concat(chunks, chunklen)
        });
      });
    }.bind(this));
  },
});

module.exports = function(options) {
  return new ConsoleTransport(options);
};
