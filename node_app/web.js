var express = require('express');
var Firebase = require('firebase');
var twilio = require('twilio');

var app = express();
app.use(express.logger());

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var firebase = new Firebase('https://glowing-fire-3800.firebaseio.com')
var twilioClient = new twilio.RestClient('AC28dceb7eff71fe3954c690f91a398dc5', 'f9e5ca1836e2145b15ce66af4a263cf1');
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
	console.log("got a new value zomg " + newValue.name() + " " + newValue.val());
	callback_objs[newValue.name()] = setTimeout(sendTwilioMessages, newValue.val()['delay'], newValue.val()['recipients']['phone'])
	if (callback_objs[newValue.name()]) {
		newValue.update({'state': 'SERVER_TIMER_SET'});
	}
	
});

firebase.on('child_updated', function(newValue) {
	console.log("got a new value zomg " + newValue.name() + " " + newValue.val());
	if (callback_obj[newValue.name()] != undefined) {
		clearTimeout(callback_objs[newValue.name()]);
		delete callback_objs[newValue.name())]; // Otherwise we'll loop forever
		newValue.update({'state': 'SERVER_TIMER_CANCELED'});
	}
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});