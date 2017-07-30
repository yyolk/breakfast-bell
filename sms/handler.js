'use strict';

const { Message, default: twiml } = require('twiml-builder');
const pp = require('ypp');
const forwardNumber         = process.env.PHONE_NUMBER || "0000000000";
const callerId              = process.env.CALLER_ID || "0000000000";
const TZ                    = process.env.TIMEZONE || "UTC";
const SMSOPTS = {
  to: forwardNumber,
  from: callerId
};

function defaultResponse(body) {
  return twiml(
    Message(
      SMSOPTS,
      "Not implemented yet"+`
      you sent: "${body}"`
    )
  );
}

module.exports.hellotwiml = (event, context, callback) => {

  //event example:
  //
  //event =
  //{
  // "body": {
  //     "ToCountry": "US",
  //     "ToState": "RM",
  //     "SmsMessageSid": "REMOVED",
  //     "NumMedia": "0",
  //     "ToCity": "Chicago",
  //     "FromZip": "000000",
  //     "SmsSid": "REMOVED",
  //     "FromState": "RM",
  //     "SmsStatus": "received",
  //     "FromCity": "REMOVED",
  //     "Body": "the content of the message sent",
  //     "FromCountry": "US",
  //     "To": "+00000000",
  //     "ToZip": "",
  //     "NumSegments": "1",
  //     "MessageSid": "REMOVED",
  //     "AccountSid": "REMOVED",
  //     "From": "+000000000",
  //     "ApiVersion": "2010-04-01"
  //

  //TODO: use this block so i can catch all errors and still give the default
  //response
  //try {
  //  const response = defaultResponse();
  //  callback(null, response);
  //} catch(e) {
  //  console.log('errored with error:', e);
  //  callback(null, defaultResponse());
  //}

  console.log('the event i got was', pp(event));
  const response = defaultResponse(event.body.Body);
  callback(null, response);

};
