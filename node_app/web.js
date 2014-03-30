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
var emergencyMessage = "Hi! %UserFirstName may need your help! They didn't check in with Mamoru and their timer has expired. We hope everything's okay.";

var buildEmergencyMessage = function(userFirstName, toFirstName) {
	return "Hi " + userFirstName + " - " + toFirstName + " may need your help! They didn't check in with Mamoru and their timer has expired. We hope everything's okay.";
}

var sendTwilioMessages = function(userName, recipients) {
	/*
	Send panic messages to the given phone numbers and names

	NOTE: toPhoneNumbers.length must equal toFirstNames.length
	*/
	recipients.forEach(function(recipient) {
		twilioClient.sms.messages.create({
		    to: recipient['number'],
		    from: twilioSecrets.fromNumber,
		    body: buildEmergencyMessage(recipient['name'], userName)
		});
		console.log("Sent message");
	});
}

var callback_objs = [];

var timerRequestsRef = firebase.child('timerRequests');

// Assume name is device id
var userSettingsRef = firebase.child('userSettings');

timerRequestsRef.on('child_added', function(newValue) {
	userSettingsRef.child(newValue.name()).on('value', function(snapshot) {
		callback_objs[newValue.name()] = setTimeout(sendTwilioMessages, newValue.val()['length'], snapshot.val()['firstName'], snapshot.val()['contacts'])
		if (callback_objs[newValue.name()]) {
			newValue.ref().update({'state': 'SERVER_TIMER_SET'});
			console.log("Adding message timer");
		}
	})
});

timerRequestsRef.on('child_removed', function(snapshot) {
	if (callback_objs[snapshot.name()] != undefined) {
		clearTimeout(callback_objs[snapshot.name()]);
		delete callback_objs[snapshot.name()]; // Otherwise we'll loop forever
		console.log("Removing message timer");
	}
});


var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
