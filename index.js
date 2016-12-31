import { Dial, Say, Sms, Play, default as twiml } from 'twiml-builder';
import moment from 'moment-timezone';

exports.handler = function(event, context, callback) {
  const forwardNumber  = process.env.FORWARD_NUMBER || "0000000000";
  const callerId       = process.env.CALLER_ID || "0000000000";
  const dtmf6URL       = "https://cdn.yolk.cc/DTMF-6.mp3";
  const startHour      = process.env.SCHEDULE_AUTO_START_HOUR || 0;
  const startMinute    = process.env.SCHEDULE_AUTO_START_MINUTE || 0;
  const startSeconds   = 0;
  const endHour        = process.env.SCHEDULE_AUTO_END_HOUR || 0;
  const endMinute      = process.env.SCHEDULE_AUTO_END_MINUTE || 0;
  const endSeconds     = 0;
  const scheduleTZ     = process.env.SCHEDULE_TIME_ZONE || 'America/Chicago';
  const accessStart    = moment().tz(scheduleTZ).hours(startHour).minutes(startMinute).seconds(startSeconds);
  const accessEnd      = moment().tz(scheduleTZ).hours(endHour).minutes(endMinute).seconds(endSeconds);
  const greeting       = process.env.GREETING || `Hello! One moment while I call YOLK!`;
  const accessGreeting = process.env.SCHEDULE_GREETING || `Hello, YOLK!`;
  let body             = '';
  let smsTemplate      = '';

  function checkSchedule() {
    //this will be more complex later...
    if (moment().isBetween(accessStart, accessEnd)) {
      return true;
    }
    else {
      return false;
    }
  }
  if (checkSchedule()) {
    let tt      = "hh:mma";
    let nott    = moment().tz(scheduleTZ).format(tt);
    let sttt    = accessStart.format(tt);
    let entt    = accessEnd.format(tt);
    smsTemplate = `Access granted for front door at ${nott}, based on auto-entry with a schedule of ${sttt}-${entt}`;
    body = twiml(
      Say({voice: 'man'}, accessGreeting),
      Sms({to: forwardNumber, from: callerId}, smsTemplate),
      Play({loop: 0}, dtmf6URL)
    );
  }
  else {
    body = twiml(
      Say({voice: 'man'}, greeting),
      Dial({callerId, timeout: 10, record: true}, forwardNumber)
    );
  }
  callback(null, {
    statusCode: '200',
    body,
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
