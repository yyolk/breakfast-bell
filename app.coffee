express = require 'express'
twilio = require 'twilio'
bodyParser = require 'body-parser'

app = express()

app.set 'port', (process.env.PORT || 5000)
app.use express.static __dirname + '/public'
# app.use bodyParser.json()
app.use bodyParser.urlencoded
  extended: true

send_xml = (res, twiml) ->
  res.set 'Content-Type', 'text/xml'
  res.send new Buffer twiml.toString()

app.get '/', (req, res) ->
  twiml = new twilio.TwimlResponse()
  twiml
  .say 'Yo, Yolk!'
  .say 'Ringing yolk'
  .dial 
    timeout: 12
    action: '/ringonce'
  , ()->
    @number process.env.FORWARD,
      url: '/gather'

  send_xml res, twiml

app.post '/hangup', (req, res) ->
  twiml = new twilio.TwimlResponse()
  twiml.hangup()
  send_xml res, twiml

app.post '/ringonce', (req, res) ->
  twiml = new twilio.TwimlResponse()
  twiml.redirect '/hangup'
  if req.body['DialCallStatus'] == 'completed'
    console.log req
    console.log req.body
    twiml.redirect '/gather'
  else
    twiml
    .say 'Trying YOLK again.'
    .dial process.env.FORWARD,
      timeout: 10
      timeLimit: 5
      action: '/ring'
  send_xml res, twiml

app.post '/gather', (req, res) ->
  twiml = new twilio.TwimlResponse()
  twiml
  .gather
    action: '/keyin'
    numDigits: 4
  , () ->
    @say 'Doorbell Yolk!'
    @say 'yolk, please enter your code'
  send_xml res, twiml

app.post '/ring', (req, res) ->
  twiml = new twilio.TwimlResponse()
  if req.body['DialCallStatus'] == 'completed'
    twiml.redirect '/gather'
  else
    twiml.say 'Sorry buddy, no answer.'
    twiml.say 'Denied!!'
    twiml.hangup()
  res.set 'Content-Type', 'text/xml'
  res.send new Buffer twiml.toString()

app.get '/sorry', (req, res) ->
  twiml = new twiml.TwimlResponse()
  twiml.say 'Sorry, no answer.'
  twiml.say 'Goodbye!'
  twiml.hangup()
  send_xml res, twiml

app.post '/keyin', (req, res) ->
  twiml = new twilio.TwimlResponse()
  # console.log req
  if req.body['Digits'] == process.env.PIN
    twiml
    .say 'Welcome home YOLK'
    .play '/DTMF-6.mp3',
      loop: 2
    .hangup()
  else if req.body['Digits'] == process.env.GUESTPIN
    twiml
    .say 'Welcom to the Breakfast House'
    .play '/DTMF-6.mp3',
      loop: 2
    .hangup()
  else
    twiml
    .say 'Denied!!'
    .say 'Good bye!'
    .hangup()

  res.set 'Content-Type', 'text/xml'
  res.send new Buffer twiml.toString()

app.listen app.get('port'), () ->
  console.log "HTTP server running on #{app.get('port')}"