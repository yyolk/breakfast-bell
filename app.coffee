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
  .say 'Yo, yolk. Doorbell.'
  # .gather
  #   action: '/keyin'
  #   numDigits: 4
  # , () ->
  #   @.say 'enter your code'
  res.set 'Content-Type', 'text/xml'
  res.send new Buffer twiml.toString()

app.post '/keyin', (req, res) ->
  twiml = new twilio.TwimlResponse()
  # console.log req
  if req.body['Digits'] == '2674'
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