http = require 'http'
twilio = require 'twilio'
PORT = process.env.port || 5000

http.createServer (req, res) ->
  twiml = new twili.TwimlResponse()
  twiml.say 'Yo, Yolk!'

  res.writeHead 200,
    'Content-Type': 'text/xml'
  res.end twiml.toString()
.listen PORT

console.log "HTTP server running on #{PORT}"