express = require 'express'
twilio = require 'twilio'
bodyParser = require 'body-parser'

app = express()

app.set 'port', (process.env.PORT || 5000)
# app.use express.static __dirname + '/public'
# app.use bodyParser.json()
app.use bodyParser.urlencoded
  extended: false

app.get '/', (req, res) ->
  twiml = new twilio.TwimlResponse()
  twiml.say 'Yo, Yolk!'
  twiml.gather
    action: '/keyin'
    numDigits: 4
  , () ->
    @.say 'enter your code'
  res.set 'Content-Type', 'text/xml'
  res.send new Buffer twiml.toString()

app.post '/keyin', (req, res) ->
  twiml = new twilio.TwimlResponse()
  console.log req
  twiml.say 'Success!'
  twiml.say "You entered #{req.json['Digits']}"
  res.set 'Content-Type', 'text/xml'
  res.send new Buffer twiml.toString()

app.listen app.get('port'), () ->
  console.log "HTTP server running on #{app.get('port')}"