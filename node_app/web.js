var express = require('express');
var Firebase = require('firebase');
var twilio = require('twilio');
var twilioSecrets = require('./twilioSecrets.js');

var app = express();
app.use(express.logger());

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var firebase = new Firebase('https://glowing-fire-3800.firebaseio.com')
var twilioClient = new twilio.RestClient(twilioSecrets.sid, twilioSecrets.authToken);
var emergencyMessage = "OH NOES - YOUR FRIEND IS MISSING! SORRY, DUDE."

var sendTwilioMessages = function(phone_numbers) {
	// Send the twilio messages
	phone_numbers.forEach(function(to_number) {
		twilioClient.sms.messages.create({
		    to:to_number,
		    from:'13399703245',
		    body:emergencyMessage
		});
	});
}

// TODO (jmagnarelli): come up with a better way to store these
var callback_objs = [];

firebase.on('child_added', function(newValue) {
	callback_objs[newValue.name()] = setTimeout(sendTwilioMessages, 10000, ['9786048120'])//newValue.val()['delay'], newValue.val()['recipients']['phone'])
	if (callback_objs[newValue.name()]) {
		newValue.ref().update({'state': 'SERVER_TIMER_SET'});
	}
	
});

firebase.on('child_changed', function(newValue) {
	if (callback_objs[newValue.name()] != undefined) {
		clearTimeout(callback_objs[newValue.name()]);
		delete callback_objs[newValue.name()]; // Otherwise we'll loop forever
		newValue.ref().update({'state': 'SERVER_TIMER_CANCELED'});
	}
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});