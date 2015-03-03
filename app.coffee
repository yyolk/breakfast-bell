express = require 'express'
app = express()
twilio = require 'twilio'

app.set 'port', (process.env.PORT || 5000)
# app.use express.static __dirname + '/public'

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

app.get '/keyin', (req, res) ->
  twiml = new twilio.TwimlResponse()
  twiml.say 'Success!'
  twiml.say "You entered #{req['Digits']}"
  res.set 'Content-Type', 'text/xml'
  res.send new Buffer twiml.toString()

app.listen app.get('port'), () ->
  console.log "HTTP server running on #{app.get('port')}"