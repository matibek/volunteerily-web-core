var _ = require('lodash');
var config = require('../config');
var events = require('../events');
var nodeMailer = require('nodemailer');
var path = require('path');
var promise = require('../promise');
var template = require('../template');
var util = require('../util');

function createTransport(type, options) {
  if (type === 'console') {
    var consoleTransport = require('./transport/console');
    return nodeMailer.createTransport(consoleTransport(options));
  }

  if (type === 'sendgrid') {
    var sgTransport = require('nodemailer-sendgrid-transport');
    return nodeMailer.createTransport(sgTransport(options));
  }

  logger.info('Mailer transport:', type);
  return nodeMailer.createTransport(options);
}

var defaultOptions = {
  transport: 'console',
  from: 'no-reply@organization.com',
};

function Mailer(options) {
  this.options = _.merge({}, defaultOptions, options);
  this.transporter = createTransport(this.options.transport, this.options.options);
}

Mailer.prototype = _.create(events.ObservableObject.prototype, {

  send: function(options) {

    if (_.has(options, 'template')) {
      return this.sendTemplate(options);
    }

    return this.sendHtml(options);

  },

  /**
   * Builds the body with the template and send an email
   */
  sendTemplate: function(options) {

    assert(options.template, 'Expected template path');

    promise
      .create(template.render(
        path.join(
          this.options.views,
          options.template + '.dot'
        ),
        {
          config: config.public || {},
          model: options.model || {},
        })
      )
      .then(function(body) {
        this.sendHtml(_.merge(options, {
          html: body,
        }));
      }.bind(this))

      .done();
  },

  /**
   * Sends an email
   */
  sendHtml: function(message) {

    assert(message, 'Expected message');
    assert(message.to, 'Email "to" address is required');
    assert(message.body || message.html, 'Email "body" or "html" is required');

    if (!message.subject) {
      logger.warning('Sending an email with no subject');
    }

    // override from
    message.from = this.options.from,

    this.transporter.sendMail(
      message,
      function(err, info) {
        if (err) {
          this.emit('error', err, {
            info: info,
            message: message,
          });

          return;
        }

        this.emit('sent', info);

      }.bind(this)
    );

  },

});

module.exports = Mailer;
