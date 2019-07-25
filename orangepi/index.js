const express = require('express');
const app = express();
var io = require('socket.io-client');
var socket = require('socket.io-client')();
const port = 1024;
var msgpack = require("msgpack-lite");

var five = require("johnny-five");
var board = new five.Board();

//var socket = io();

app.get('/', (req, res) => res.send(JSON.stringify({
	res: "Hello world!"
})));

board.on("ready", function () {
	servoFinger = new Array();

	servoFinger['pinkie'] = new five.Servo({
		pin: 10, // Servo 1
		range: [0, 150], // Default: 0-180
		type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
		startAt: 30, // if you would like the servo to immediately move to a degree
		center: false // overrides startAt if true and moves the servo to the center of the range
	});

	// ANNULAR
	servoFinger['ring'] = new five.Servo({
		pin: 9, // Servo 3
		range: [0, 180], // Default: 0-180
		type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
		startAt: 30, // if you would like the servo to immediately move to a degree
		center: false // overrides startAt if true and moves the servo to the center of the range
	});

	// MIDDLE FINGER
	servoFinger['middle'] = new five.Servo({
		pin: 6, // Servo 5
		range: [0, 180], // Default: 0-180
		type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
		startAt: 30, // if you would like the servo to immediately move to a degree
		center: false // overrides startAt if true and moves the servo to the center of the range
	});

	// THUMB
	servoFinger['thumb'] = new five.Servo({
		pin: 3, // Servo 2
		range: [0, 180], // Default: 0-180
		type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
		startAt: 30, // if you would like the servo to immediately move to a degree
		center: false // overrides startAt if true and moves the servo to the center of the range
	});

	// INDEX FINGER
	servoFinger['index'] = new five.Servo({
		pin: 5, // Servo 4
		range: [0, 180], // Default: 0-180
		type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
		startAt: 30, // if you would like the servo to immediately move to a degree
		center: false // overrides startAt if true and moves the servo to the center of the range
	});

	//palm servo
	palm = new five.Servo({
		pin: 11,
		range: [0,70],
		startAt: 0,
		center: false
	});

	//biceps servo
	var biceps = new five.Servo({
        pin: 12,
        range: [8, 90],
        startAt: 8
    });

	//umar servo
    var umar = new five.Servo({
        pin: 13,
        range: [20, 160],
        startAt: 90
    });

	app.post('/connect/:ip', (req, res) => {
		console.log(req.params.ip);
		socket = io.connect('http://' + req.params.ip);
		socket.on('newdata', function (data) {
			//console.log(new Date());
			console.log(data);
			// servo.to(data.servo);
			servoFinger['thumb'].to(data.thumb);
			servoFinger['index'].to(data.index);
			servoFinger['middle'].to(data.middle);
			servoFinger['ring'].to(data.ring);
			servoFinger['pinkie'].to(data.pinkie);
			palm.to(data.palm);
			biceps.to(data.biceps);
			umar.to(data.umar);
		});
		res.send(JSON.stringify({ res: 'M-am conectat' }));
	});

	app.post('/close', (req,res)=>{
		servoFinger['thumb'].to(data.thumb);
			servoFinger['index'].to(0);
			servoFinger['middle'].to(0);
			servoFinger['ring'].to(0);
			servoFinger['pinkie'].to(0);
			palm.to(0);
			biceps.to(8);
			umar.to(90);
	});

});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));