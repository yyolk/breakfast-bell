import AWS from 'aws-sdk';
import regeneratorRuntime from "regenerator-runtime";
import pp from 'ypp';
import request from 'request';
import ical from 'ical/ical';
import qs from 'qs';
import moment from 'moment-timezone';
import 'moment-range';
import 'core-js/modules/es6.reflect.own-keys';
import { Dial, Say, Sms, Play, default as twiml } from 'twiml-builder';

const forwardNumber         = process.env.FORWARD_NUMBER || "0000000000";
const callerId              = process.env.CALLER_ID || "0000000000";
const dtmf6URL              = "https://cdn.yolk.cc/DTMF-6.mp3";
const startHour             = process.env.SCHEDULE_AUTO_START_HOUR || 0;
const startMinute           = process.env.SCHEDULE_AUTO_START_MINUTE || 0;
const startSeconds          = 0;
const endHour               = process.env.SCHEDULE_AUTO_END_HOUR || 0;
const endMinute             = process.env.SCHEDULE_AUTO_END_MINUTE || 0;
const endSeconds            = 0;
const scheduleTZ            = process.env.SCHEDULE_TIME_ZONE || 'America/Chicago';
const accessStart           = moment().tz(scheduleTZ).hours(startHour).minutes(startMinute).seconds(startSeconds);
const accessEnd             = moment().tz(scheduleTZ).hours(endHour).minutes(endMinute).seconds(endSeconds);
const greeting              = process.env.GREETING || `Hello! One moment while I call YOLK!`;
const accessGreeting        = process.env.SCHEDULE_GREETING || `Hello, YOLK!`;
const dynamo                = new AWS.DynamoDB.DocumentClient();
const tableName             = process.env.TABLE_NAME || null;
const configTableName       = process.env.CONFIG_TABLE_NAME || null;
const doorAccessCalendarURL = process.env.DOOR_ACCESS_CALENDAR_URL || null;

const DEFAULT_CONFIG  = {
  "someSetting": 'someValue',
  "updatedAt": moment().format(),
  "someInsideVar": dtmf6URL
};

function getConfig() {
  if (!configTableName) {
    return null;
  }
  let params = {
    TableName: configTableName,
    Key: {
      id: 'settings'
    }
  };

  return dynamo.get(params).promise()
  .then((data) => {
    console.log('getitems data is ', pp(data));
    try {
      if (!data || !data.Item.config) {
        return null;
      }
      console.log(`RETRIEVED ITEM SUCCESSFULLY WITH doc = ${pp(data.Item)}`);
      return data.Item.config;
    } catch (e) {
      return null;
    }
  }).catch( (err) => {
    console.log(`GET ITEM FAILED FOR doc = ${data.Item}, WITH ERROR: ${err}`);
    //bubble up, unexpected error
    throw(err);
  });
}

function setConfig(config) {
  if (!configTableName) {
    throw(new Error('no config table set'));
  }
  if (!config) {
    //no config yet, make it
    config = DEFAULT_CONFIG;
  }
  let item = {
    id: 'settings',
    config
  };
  let params = {
    TableName: configTableName,
    Item: item
  };
  return dynamo.put(params).promise()
    .then((data) => {
      console.log('data in setConfigs put is', pp(data));
      console.log(`Put suceeded with item of ${pp(data.Item)}`);
      // return data.Item.config;
      return config;
    }).catch((err) => {
      console.log(`PUT ITEM FAILED FOR doc = ${pp(item)}, WITH ERROR: ${err}`);
      //bubble up, unexpected error
      throw(err);
    });
}

function checkConfig() {
  let config = {};
  async function configCheck() {
    try {
      config = await getConfig();
    } catch (e) {
      // theres no config set
      console.log('error during checkConfig!', e);
    } finally {
      if (config) {
        return true;
      }
      //fail safely, skip - config is not set, but table exists
      return false;
    }
  }
  return configCheck();
}

function checkDoorAccessCalendar() {
  if(doorAccessCalendarURL === null) {
    throw(new Error('Trying to check calendar without a URL set!'));
  }
  function getCalendar() {
    return new Promise(function(resolve, reject){
      request({
        method: 'GET',
        url: doorAccessCalendarURL,
        json: true,
        headers: {
          'User-Agent': 'request'
        }
      }, function(err, resp, body){
        if(err){
          reject(err);
        } else {
          resolve(body);
        }
      });
    });
  }
  return getCalendar().then((data) => {
    // console.log('data is', data);
    // console.log('ical parsed is', pp(ical.parseICS(data)));
    let ranges = [];
    let accessAllowed = false;
    data = ical.parseICS(data);
    for (var k in data) {
      if (data.hasOwnProperty(k) && data[k].type == "VEVENT") {
        let ev = data[k];
        // console.log('ev is', pp(ev));
        let range = moment.range(ev.start, ev.end)
        // console.log('range is', range.toString());
        if (moment().within(range)) {
          accessAllowed = {
            start: range.start,
            end: range.end,
            summary: ev.summary,
            description: ev.description
          };
        }
        ranges.push(range);
      }
    }
    return accessAllowed;
  });
}


async function checkSchedule() {
  //this will be more complex later...
  if (moment().isBetween(accessStart, accessEnd)) {
    return {
      start: accessStart,
      end: accessEnd,
      summary: 'auto-access',
      description: 'Daily auto-access override'
    };
  }
  else {
    let calendarDoorAcess = await checkDoorAccessCalendar();
    if (calendarDoorAcess) {
      return calendarDoorAcess;
    }
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

export async function handler(event, context, callback) {
  console.log('event is', pp(event));
  console.log('context is', pp(context));

  //check config, if it doesn't exist set it to default (first boot, reset)
  let config = (await checkConfig()) ? await getConfig() : await setConfig(null);
  console.log('config is', pp(config));
  context.appConfig = config;

  if (event.path === '/recording') {
    return handleRecording(event, context, callback);
  }

  let body        = '';
  let smsTemplate = '';
  let schedule    = await checkSchedule();

  if (schedule) {
    let tt      = "hh:mma";
    let nott    = moment().tz(scheduleTZ).format(tt);
    let sttt    = schedule.start.format(tt);
    let entt    = schedule.end.format(tt);
    let summary = schedule.summary ? schedule.summary : 'Unknown';
    smsTemplate = `Access granted for front door at ${nott}, based on "${summary}" with a schedule of ${sttt}-${entt}`;

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
  //we know what's returning but this is good for debugging
  console.log('returning', pp(body));
  callback(null, {
    statusCode: '200',
    body,
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
