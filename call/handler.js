'use strict';

const dtmf6URL = "https://cdn.yolk.cc/DTMF-6.mp3";
const { Dial, Say, Sms, Play, default: twiml } = require('twiml-builder');
const Moment = require('moment-timezone');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const request = require('request');
const { ICalParser } = require('cozy-ical');
const parser = new ICalParser();
const pp = require('ypp');
const doorAccessCalendarURL = process.env.DOOR_ACCESS_CALENDAR_URL || null;
const forwardNumber         = process.env.PHONE_NUMBER || "0000000000";
const callerId              = process.env.CALLER_ID || "0000000000";
const TZ                    = process.env.TIMEZONE || "UTC";
const DIALOPTS = {
  callerId,
  timeout: 10
};
//const DIALOPTS = {
//  callerId,
//  timeout: 10/*,
//  record: 'record-from-answer',
//  recordingStatusCallback:'/prod/recording'*/
//};
const SAYOPTS = {
  voice: 'alice'
};
const SMSOPTS = {
  to: forwardNumber,
  from: callerId
};
const PLAYOPTS = {
  loop: 0
};

function getCalendarAccess() {
  return new Promise((resolve, reject) => {
    let r = {
      method: 'GET',
      url: doorAccessCalendarURL,
      json: true,
      headers: {
        'User-Agent': 'request'
      }
    };
    request(r, (err, resp, body) => {
      err && reject(err);
      parser.parseString(body, (err, cal) => {
         err && reject(err);
         let accessAllowed = false;
         console.log('length is', cal.subComponents.length);
         cal.subComponents.forEach((subComponent) => {
           try {
             let model = subComponent.model;
             let startDate = model.startDate;
             let endDate = model.endDate;
             let summary = model.summary;
             let description = model.description || summary;
             summary && console.log(startDate, endDate, summary);
             let start = moment.utc(startDate).tz(TZ).clone().utc();
             let end = moment.utc(endDate).tz(TZ).clone().utc();
             let range = moment.range(start, end);
             console.log('range is', range.toString());
             if (moment.utc().within(range) && summary) {
               accessAllowed = {
                 start,
                 end,
                 summary,
                 description
               };
             }
           } catch(e) { console.error(e); }
         });
         resolve(accessAllowed);
      });
    });
  });
}

function defaultResponse() {
  return twiml(
     Say(
       SAYOPTS,
       "Sup, calling YOLK."
     ),
     Dial(
       DIALOPTS,
       forwardNumber
     )
  );
}

module.exports.hellotwiml = (event, context, callback) => {
  try {
    getCalendarAccess().then((result) => {
      console.log('i got', pp(result));
      let accessAllowed = result;
      let response = null;
      if (accessAllowed) {
        let tt      = "hh:mma";
        let nott    = moment.utc().tz(TZ).format(tt);
        let sttt    = accessAllowed.start.tz(TZ).format(tt);
        let entt    = accessAllowed.end.tz(TZ).format(tt);
        let summary = accessAllowed.summary;
        let description =
          accessAllowed.description
          ? result.summary
          : `!! i dont have a default summary !!`;
        let moreInfo =
          (description == summary)
          ? ''
          : ` --> More info: "${description}"`;
        let smsTemplate = `Access granted for front door at ${nott}, based on "${summary}" with a schedule of ${sttt}-${entt}.${moreInfo}`;

        response = twiml(
          Say(
            SAYOPTS,
            `Hello, ${summary}.`
          ),
          Sms(
            SMSOPTS,
            smsTemplate
          ),
          Play(
            PLAYOPTS,
            dtmf6URL
          )
        );
      } else {
        response = defaultResponse();
      }
      callback(null, response);
    });
  } catch(e) {
    console.log('errored with error:', e);
    //TODO: need error push notification here
    callback(null, defaultResponse());
  }
};
