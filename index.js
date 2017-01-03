import AWS from 'aws-sdk';
import pp from 'ypp';
import 'core-js/modules/es6.reflect.own-keys';
import { Dial, Say, Sms, Play, default as twiml } from 'twiml-builder';
import qs from 'qs';
import moment from 'moment-timezone';

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
const dynamo         = new AWS.DynamoDB.DocumentClient();
const tableName      = process.env.TABLE_NAME || null;


function checkSchedule() {
  //this will be more complex later...
  if (moment().isBetween(accessStart, accessEnd)) {
    return true;
  }
  else {
    return false;
  }
}

//handle recording url callabcks
// if (event.path === '/recording') {
//
// }
function handleRecording(event, context, callback) {
  console.log('handling recording');
  let twilioRequest = qs.parse(event.body);
  if (twilioRequest.RecordingStatus === 'completed') {
    let recordingUrl = twilioRequest.RecordingUrl;
    let callSid      = twilioRequest.CallSid;
    let item = {
      id: callSid,
      createdAt: moment().format(),
      recordingUrl,
      rawRequest: twilioRequest
    };
    let params = {
      TableName: tableName,
      Item: item
    };
    console.log(`Recording URL: ${recordingUrl}`);
    return dynamo.put(params).promise()
      .then((data) => {
        console.log(`Put suceeded with item of ${pp(item)}`);
        callback(null, {
          statusCode: 200,
          body: twiml(Sms({to: forwardNumber, from: callerId}, 'testing worked')),
          headers: {
            'Content-Type': 'application/xml'
          }
        });
      }).catch((err) => {
        console.log(`PUT ITEM FAILED FOR doc = ${pp(item)}, WITH ERROR: ${err}`);
        callback(null, {statusCode: 500, body:pp(err)});
      });
  }
}
export function recording(event, context, callback) {
  handleRecording(event, context, callback);
}


//handle sms
// if (event.path === '/sms') {
//
// }
export function sms(event, context, callback) {

}

// async function init() {
//   //TODO: move init here
//   //let config = (await checkConfig()) ? await getConfig() : await setConfig(null);
// }

  console.log('event is', pp(event));
  console.log('context is', pp(context));
  if (event.path === '/recording') {
    return handleRecording(event, context, callback);
  }
  let body             = '';
  let smsTemplate      = '';

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
      Dial({callerId, timeout: 10, record: 'record-from-answer', recordingStatusCallback:'/Prod/recording'}, forwardNumber),
      // Hangup(),
      // Message('testing')
      // Redirect()
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
