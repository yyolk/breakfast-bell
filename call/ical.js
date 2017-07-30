var pp = require('ypp');
//var Moment = require('moment-timezone');
//var MomentRange = require('moment-range');
//var moment = MomentRange.extendMoment(Moment);
var moment = (function() {
  var Moment = require('moment-timezone');
  var MomentRange = require('moment-range');
  return MomentRange.extendMoment(Moment);
}());
var request = require('request');

//var ICalParser = require('cozy-ical').ICalParser;

var TZ = 'America/Chicago';
//var ical = require('node-ical-improved');
var { ICalParser } = require('cozy-ical');
parser = new ICalParser();

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


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
    //console.log('body is', body);
    //var cal = ical.parseICS(body);
    parser.parseString(body, (err, cal) => {
      var util = require('util');
      console.log(Object.getOwnPropertyNames(cal));
      //console.log(util.inspect(cal.subComponents));
      console.log('length is', cal.subComponents.length);
      for (var i in cal.subComponents) {
        try {
          var entry = cal.subComponents[i];
          var model = entry.model;
          console.log(model);
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
    //var util = require('util');

    //console.log(util.inspect(cal));
    //console.log(cal.getRawValue('PRODID'));
    // console.log(cal.subComponents);

    // console.log(cal.subComponents[0].getRawValue('SUMMARY'));

    //console.log(Object.getOwnPropertyNames(cal));


    //for (var k in cal){
    //  //console.log('k is', k);
    //  if (cal.hasOwnProperty(k)) {
    //    var ev = cal[k]
    //    if (ev.type = 'VEVENT') {
    //      console.log(util.inspect(ev));
    //      console.log(ev.summary, ev.start);
    //      try {
    //        var start = moment.utc(ev.start).tz(TZ);
    //        var end = moment.utc(ev.end).tz(TZ);
    //        var range = moment.range(start.clone().utc(), end.clone().utc());
    //        console.log('range is', range.toString());
    //        var isHappening = moment.utc().within(range);
    //        console.log('is happening now?', isHappening, 'summary is', ev.summary);
    //        if (isHappening) console.log('\n\n\n\n\nFOUND ONE\n\n');
    //        if (isHappening) process.exit();

    //      } catch(e) { console.error(e); }
    //    }
    //  }
    //};








    //for (var i in cal.subComponents) {
    //  try {
    //    var entry = cal.subComponents[i];
    //    var model = entry.model;
    //    entry.model.summary && console.log(model.startDate, model.endDate, model.summary);
    //    var start = moment.utc(model.startDate).tz('America/Chicago');
    //    var end = moment.utc(model.endDate).tz('America/Chicago');
    //    var range = moment.range(start.clone().utc(), end.clone().utc());
    //    console.log('range is', range.toString());
    //    console.log('is happening now?', moment.utc().within(range));
    //    console.log('entry keys are', Object.keys(entry));
    //  } catch(e) { console.error(e) ;}
    //}
  }
});

//ical.fromURL(process.env.DOOR_ACCESS_CALENDAR_URL || console.error('You must set a DOOR_ACCESS_CALENDAR_URL\n use any web ics link'), {}, function(err, data) {
//  for (var k in data){
//    if (data.hasOwnProperty(k)) {
//      var ev = data[k]
//      console.log("Conference",
//        ev.summary,
//        'is in',
//        ev.location,
//        'on the', ev.start.getDate(), 'of', months[ev.start.getMonth()]);
//    }
//  }
//});

////var parser = new ICalParser();
//// make a calendar and use the ics link
//var doorAccessCalendarURL = process.env.DOOR_ACCESS_CALENDAR_URL || console.error('You must set a DOOR_ACCESS_CALENDAR_URL\n use any web ics link');
//request({
//  method: 'GET',
//  url: doorAccessCalendarURL,
//  json: true,
//  headers: {
//    'User-Agent': 'request'
//  }
//}, function(err, resp, body){
//  if(err){
//    // reject(err);
//  } else {
//    console.log('body is', body);
//    parser.parseString(body, function(err, cal) {
//      console.log(cal.name);
//      console.log(pp(require('util').inspect(cal)));
//      console.log(cal.getRawValue('PRODID'));
//      // console.log(cal.subComponents);
//
//      // console.log(cal.subComponents[0].getRawValue('SUMMARY'));
//      cal.subComponents.map(function(s) {
//        if (s.hasOwnProperty('VEVENT')) {
//          // console.log(s);
//          return s;
//        }
//        return null;
//      });
//      // console.log(require('util').inspect(cal.subComponents));
//      console.log('length is', cal.subComponents.length);
//      for (var i in cal.subComponents) {
//        try {
//          var entry = cal.subComponents[i];
//          var model = entry.model;
//          entry.model.summary && console.log(model.startDate, model.endDate, model.summary);
//          var start = moment.utc(model.startDate).tz('America/Chicago');
//          var end = moment.utc(model.endDate).tz('America/Chicago');
//          var range = moment.range(start.clone().utc(), end.clone().utc());
//          console.log('range is', range.toString());
//          console.log('is happening now?', moment.utc().within(range));
//          console.log('entry keys are', Object.keys(entry));
//        } catch(e) { console.error(e) ;}
//      }
//    });
//    // resolve(body);
//  }
//});
