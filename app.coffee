express = require 'express'
twilio = require 'twilio'
bodyParser = require 'body-parser'

app = express()

app.set 'port', (process.env.PORT || 5000)
app.use express.static __dirname + '/public'
# app.use bodyParser.json()
app.use bodyParser.urlencoded
  extended: true

app.get '/', (req, res) ->
  twiml = new twilio.TwimlResponse()
  twiml.say 'Yo, Yolk!'
  .dial process.env.FORWARD,
    timeout: 15
    timeLimit: 5
    action: '/ring'
  .say 'Ringing yolk'
  
  res.set 'Content-Type', 'text/xml'
  res.send new Buffer twiml.toString()

app.post '/ring', (req, res) ->
  twiml = new twilio.TwimlResponse()
  if req.body['DialCallStatus'] == 'completed'
    twiml.say 'Doorbell Yolk!'
    .gather
      action: '/keyin'
      numDigits: 4
    , () ->
      @.say 'enter your code'
  else
    twiml.say 'Sorry buddy, no answer.'
    twiml.say 'Denied!!'
    twiml.hangup
  res.set 'Content-Type', 'text/xml'
  res.send new Buffer twiml.toString()

app.post '/keyin', (req, res) ->
  twiml = new twilio.TwimlResponse()
  # console.log req
  if req.body['Digits'] == process.env.PIN
    twiml
    .say 'Welcome home YOLK'
    .play '/DTMF-6.mp3',
      loop: 2
  else
    twiml
    .say 'Denied!!'
    .say 'Good bye!'

  res.set 'Content-Type', 'text/xml'
  res.send new Buffer twiml.toString()

app.listen app.get('port'), () ->
  console.log "HTTP server running on #{app.get('port')}"