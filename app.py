from flask import Flask, request, redirect
import twilio.twiml
from datetime import datetime

app = Flask(__name__)
app.debug = True


@app.route("/", methods=['GET','POST'])
def open_door():
    resp = twilio.twiml.Response()
    resp.play("http://jetcityorange.com/dtmf/DTMF-6.mp3")
    return str(resp)

@app.route("/handle_key", methods=['GET','POST'])
def handle_key():
    resp = twilio.twiml.Response()
    digit_pressed = request.values.get('Digits', None)
    if digit_pressed == "1":
        resp.play("http://jetcityorange.com/dtmf/DTMF-6.mp3")
    return str(resp)

    
if __name__ == "__main__":
    app.run(debug=True)