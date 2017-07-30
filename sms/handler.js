'use strict';

const { Message, default: twiml } = require('twiml-builder');
const forwardNumber         = process.env.PHONE_NUMBER || "0000000000";
const callerId              = process.env.CALLER_ID || "0000000000";
const TZ                    = process.env.TIMEZONE || "UTC";
const SMSOPTS = {
  to: forwardNumber,
  from: callerId
};

function defaultResponse() {
  return twiml(
    Message(
      SMSOPTS,
      "Not implemented yet"
    )
  );
}

module.exports.hellotwiml = (event, context, callback) => {

  //TODO: use this block so i can catch all errors and still give the default
  //response
  //try {
  //  const response = defaultResponse();
  //  callback(null, response);
  //} catch(e) {
  //  console.log('errored with error:', e);
  //  callback(null, defaultResponse());
  //}

  const response = defaultResponse();
  callback(null, response);

};
