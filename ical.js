var pp = require('ypp');
var moment = require('moment-timezone');
require('moment-range');
var request = require('request');

var ICalParser = require('cozy-ical').ICalParser;

var parser = new ICalParser();
// make a calendar and use the ics link
var doorAccessCalendarURL = process.env.DOOR_ACCESS_CALENDAR_URL || console.error('You must set a DOOR_ACCESS_CALENDAR_URL\n use any web ics link');
request({
  method: 'GET',
  url: doorAccessCalendarURL,
  json: true,
  headers: {
    'User-Agent': 'request'
  }
}, function(err, resp, body){
  if(err){
    // reject(err);
  } else {
    console.log('body is', body);
    parser.parseString(body, function(err, cal) {
      console.log(cal.name);
      console.log(pp(require('util').inspect(cal)));
      console.log(cal.getRawValue('PRODID'));
      // console.log(cal.subComponents);

      // console.log(cal.subComponents[0].getRawValue('SUMMARY'));
      cal.subComponents.map(function(s) {
        if (s.hasOwnProperty('VEVENT')) {
          // console.log(s);
          return s;
        }
        return null;
      });
      // console.log(require('util').inspect(cal.subComponents));
      console.log('length is', cal.subComponents.length);
      for (var i in cal.subComponents) {
        try {
          var entry = cal.subComponents[i];
          var model = entry.model;
          entry.model.summary && console.log(model.startDate, model.endDate, model.summary);
          var start = moment.utc(model.startDate).tz('America/Chicago');
          var end = moment.utc(model.endDate).tz('America/Chicago');
          var range = moment.range(start.clone().utc(), end.clone().utc());
          console.log('range is', range.toString());
          console.log('is happening now?', moment.utc().within(range));
          console.log('entry keys are', Object.keys(entry));
        } catch(e) { console.error(e) ;}
      }
    });
    // resolve(body);
  }
});
