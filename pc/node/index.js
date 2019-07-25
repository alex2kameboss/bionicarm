var nmap = require('node-nmap');
var cors = require('cors');
const internalIp = require('internal-ip');
const express = require('express');
var https = require('http');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = 3000;
var msgpack = require("msgpack-lite");

var tracking = 'false';

app.use(cors());

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/search', (req, res) => {
	nmap.nmapLocation = "nmap";

	var lip = internalIp.v4.sync().split(/\.(?=[^\.]+$)/)[0] + ".*";
	console.log(lip);

	var nmapscan = new nmap.NmapScan('1024 ' + lip, '-p');

	//console.log("internal ip", internalIp.v4.sync());

	var rez = [];

	nmapscan.on('complete', function (data) {
		//console.log(data);
		for (var i = 0; i < data.length; ++i) {
			//console.log("ip: ", data[i].ip);
			//console.log("ports: ", data[i].openPorts);
			if (data[i].openPorts.length > 0) {
				console.log("ip : " + data[i].ip);
				rez.push(data[i].ip);
			}
		}
		console.log(rez);

		return res.send(JSON.stringify(rez));
	});
	nmapscan.on('error', function (error) {
		console.log(error);
	});

	nmapscan.startScan();
});

app.post("/tracking/:val", (req, res) => {
	tracking = req.params.val;
	res.send("OK");
});

app.post('/connect/:ip', (lreq, lres) => {
	var lip = internalIp.v4.sync();
	console.log(lreq.params);
	const options = {
		host: lreq.params.ip,
		port: 1024,
		path: '/connect/' + lip + ':3000',
		method: 'POST'
	}

	const req = https.request(options, res => {
		//console.log(`statusCode: ${res.statusCode}`)

		res.on('data', d => {
			//console.log(d);
			lres.send(d);
		})
	})

	req.on('error', error => {
		console.error(error)
	})

	req.end()
})

io.on('connection', function (socket) {
	console.log('a user connected');
	//console.log(socket);
});

server.listen(port, () => console.log(`Example app listening on port ${port}!`));

//hand lib
var handToHand = function () {

	// THIS FUNCTION CALCULATE THE ANGLE BETWEEN 2 VECTORS
	var _vectorAngle = function (v1, v2) {

		// FIRST VECTOR COMPONENTS
		var v1_x = v1[0];
		var v1_y = v1[1];
		var v1_z = v1[2];

		// SECOND VECTOR COMPONENTS
		var v2_x = v2[0];
		var v2_y = v2[1];
		var v2_z = v2[2];

		// DOT PRODUCT
		var dotProduct = v1_x * v2_x + v1_y * v2_y + v1_z * v2_z;

		// BOTH VECTOR'S MODULUS (MAGNITUDE) 
		var v1_magnitude = Math.sqrt(v1_x * v1_x + v1_y * v1_y + v1_z * v1_z);
		var v2_magnitude = Math.sqrt(v2_x * v2_x + v2_y * v2_y + v2_z * v2_z);

		// RETRIEVE THE ANGLE (IN RADIANS) BETWEEN THE 2 VECTORS
		var angle_radians = Math.acos(dotProduct / (v1_magnitude * v2_magnitude));

		// RADIANS TO DEGREES CONVERSION
		return angle_radians * 180 / Math.PI;
	};

	// THIS FUNCTION VERIFY THE VALIDITY OF THE ID-SERVOS OBJECT
	var _checkIdsToServos = function (fingers, idsToServos) {

		// SET THE RESULT ON TRUE
		var check = true;

		// FOR EACH FINGER
		for (var j = 0; j < fingers.length; j++) {

			// CURRENT FINGER
			var finger = fingers[j];

			// CURRENT FINGER ID
			var finger_id = finger.id;

			// IF THIS FINGER ID IS NOT PRESENT INSIDE THE ID-SERVO OBJECT THEN SET THE RESULT ON FALSE
			if (typeof idsToServos[finger_id] === "undefined") {
				check = false;
				break;
			}
		}

		return check;
	};


	// THIS FUNCTION RENEW THE ID-SERVOS OBJECT
	var _refreshIdsToServos = function (fingers) {

		var servosArray = new Array();
		servosArray[0] = 'thumb'; // THUMB
		servosArray[1] = 'index'; // INDEX
		servosArray[2] = 'middle'; // MIDDLE
		servosArray[3] = 'ring'; // ANNULAR
		servosArray[4] = 'pinkie'; // PINKIE

		var idsToStabilizedX = {};
		var idsToServos = {};
		var sortable = [];

		// FOR EACH FINGER
		for (var j = 0; j < fingers.length; j++) {

			// CURRENT FINGER
			var finger = fingers[j];

			// CURRENT FINGER ID
			var finger_id = finger.id;

			// CURRENT FINGER X COORDINATE
			var finger_stabilized_x_position = finger.stabilizedTipPosition[0].toFixed(0);

			// IT IS IMPORTANT TO USE AN OBJECT AND NOT AN ARRAY HERE EVEN IF IT COMPLICATES THE SORTING PROCESS
			// BECAUSE FINGERS ID CAN ASSUME VERY HIGH VALUES AND USING AN ARRAY MAY PRODUCE EMPTY INDEXES GENERETING BIG AND USELESS ARRAY
			idsToStabilizedX[finger_id] = finger_stabilized_x_position;

		}

		// IN ORDER TO SORT THE OBJECT WE FIRST ASSIGN AN ARRAY WITH ALL OBJECT'S VALUES AND THEN WE SORT THE ARRAY
		for (var id_finger in idsToStabilizedX)
			sortable.push([id_finger, idsToStabilizedX[id_finger]]);

		// SORT THE ARRAY
		sortable.sort(function (a, b) { return a[1] - b[1] });

		// NOW WE CAN TAKE THE ID-X_COORDINATES SORTED ARRAY AND WE GENERATE THE ID-SERVOS OBJECT
		for (var i = 0; i < sortable.length; i++) {

			// CURRENT FINGER
			var this_finger_id = sortable[i][0];

			// CURRENT FINGER SERVO
			var this_finger_servo = servosArray[i];

			// UPDATE ID-SERVOS OBJECT
			idsToServos[this_finger_id] = this_finger_servo;

			// DEBUG
			console.log('COUNTER: ' + i + ', SERVO NAME: ' + this_finger_servo + ', FINGER ID: ' + this_finger_id + ', X_COORDINATE: ' + sortable[i][1]);
		};

		return idsToServos;

	};

	// THIS FUNCTION CLOSE ALL NOT DETECTED FINGERS
	var _closeAbsentFingers = function (fingers, idsToServos, data) {

		// BUFFER
		var idsToServosBuffer = {};

		// LET'S CLONE A ID-SERVO DUPLICATE
		for (var key in idsToServos) {

			// SERVO NAME
			var nome_servo = idsToServos[key];

			// FINGER ID
			var id_leap = key;

			// BUFFER OBJECT
			idsToServosBuffer[id_leap] = nome_servo;

		}

		// NOW WE CAN REMOVE ALL DETECTED FINGERS (SO THAT ONLY NOT DETECTED FINGERS WILL REMAIN)
		for (var j = 0; j < fingers.length; j++) {

			// CURRENT FINGER
			var finger = fingers[j];

			// CURRENT FINGER ID
			var finger_id = finger.id;

			// REMOVE DETECTED FINGERS
			delete idsToServosBuffer[finger_id];

		}

		// FOR EACH NOT DETECTED FINGER
		for (var key in idsToServosBuffer) {

			// SERVO NAME
			var nome_servo = idsToServosBuffer[key];

			// FINGER ID
			var id_leap = key;

			// LET'S CLOSE THIS FINGER BECAUSE IT WASN'T DETECTED
			_fingerClose(data, nome_servo);

			// console.log('ID: '+id_leap+', SERVO: '+nome_servo);

		}

	}

	// MAKE A FIST
	var _punch = function (data) {
		data['pinkie'] = 180;
		data['ring'] = 180;
		data['middle'] = 180;

		// REMEMBER THAT THUMB AND INDEX FINGERS HAVE THEIR SERVOS INVERTED ON THE ARM!
		data['index'] = 180;
		data['thumb'] = 180;
	}

	// RELAX THE HAND
	var _relax = function (data) {
		data['pinkie'] = 0;
		data['ring'] = 0;
		data['middle'] = 0;

		// REMEMBER THAT THUMB AND INDEX FINGERS HAVE THEIR SERVOS INVERTED ON THE ARM!
		data['index'] = 0;
		data['thumb'] = 0;
	}

	// CLOSE A SINGLE FINGER
	var _fingerClose = function (data, selectedFinger) {

		// REMEMBER THAT THUMB AND INDEX FINGERS HAVE THEIR SERVOS INVERTED ON THE ARM!
		if (selectedFinger == 'thumb' || selectedFinger == 'index')
			data[selectedFinger] = 180;
		else
			data[selectedFinger] = 180;
	}

	// OPEN A SINGLE FINGER
	var _fingerOpen = function (data, selectedFinger) {

		// REMEMBER THAT THUMB AND INDEX FINGERS HAVE THEIR SERVOS INVERTED ON THE ARM!
		if (selectedFinger == 'thumb' || selectedFinger == 'index')
			data[selectedFinger] = 0;
		else
			data[selectedFinger] = 0;
	}

	// MOVE A SINGLE FINGER
	var _moveFingerTo = function (data, fingerAngle, servo, oldServoAngles, servoSensibility) {

		// REMEMBER THAT THUMB AND INDEX FINGERS HAVE THEIR SERVOS INVERTED ON THE ARM!
		if (servo == 'thumb' || servo == 'index')
			var servoAngle = (20 + (100 - fingerAngle) * 1.5); // EMPIRICAL CONVERSION, MAY BE DIFFERENT FOR DIFFERENT SERVOS!
		else
			var servoAngle = (20 + (100 - fingerAngle) * 1.5);  // EMPIRICAL CONVERSION, MAY BE DIFFERENT FOR DIFFERENT SERVOS!

		// WE MUST BE SURE NOT TO GIVE SERVOS AN ANGLE OUT OF ITS RANGE
		if (servoAngle < 60)
			servoAngle = 0;
		else if (servoAngle > 100)
			servoAngle = 170;

		// SOME DEBUG
		console.log("THE FINGER " + servo + " IS SET TO: " + fingerAngle + '°');
		console.log("THE FINGER " + servo + " IS MOVING TO: " + servoAngle + '°');

		// NOW IF A PREVIOUS SERVO POSITION IS STORED, WE MUST CALCULATE THE DIFFERENCE
		// BETWEEND THE NEW ANGLE AND THE OLD ONE
		// AND MOVE THE SERVO ONLY IF THE SENSIBILITY THRESHOLD IS EXCEEDED
		if (oldServoAngles[servo] > 0) {

			// DIFFERENCE
			var anglesDelta = Math.abs(parseInt(servoAngle) - parseInt(oldServoAngles[servo]));

			// DEBUG
			//console.log("ANGLES DIFFERENCE (DELTA): "+anglesDelta+'°');

			// IF THE DIFFERENCE EXCEED SENSIBILITY THRESHOLD THEN WE MOVE THE SERVO
			if (anglesDelta > servoSensibility[servo]) {
				oldServoAngles[servo] = servoAngle;
				data[servo] = (servoAngle);
			}

			// IF THERE ISN'T AN OLD ANGLE STORED WE JUST MOVE THE SERVO
		} else {
			oldServoAngles[servo] = servoAngle;
			data[servo] = (servoAngle);
		}

	}

	return {
		vectorAngle: _vectorAngle,
		checkIdsToServos: _checkIdsToServos,
		punch: _punch,
		relax: _relax,
		fingerClose: _fingerClose,
		fingerOpen: _fingerOpen,
		refreshIdsToServos: _refreshIdsToServos,
		closeAbsentFingers: _closeAbsentFingers,
		moveFingerTo: _moveFingerTo
	};
};

module.exports = handToHand;

Leap = require("../pc/lib/index");


// ASSIGN SERVOS SENSIBILITY (THIS IS THE ANGLES THRESHOLD)
servoSensibility = { 'pollice': 0, 'indice': 0, 'medio': 0, 'anulare': 0, 'mignolo': 0 };


// ASSIGN LEAP MOTION CONTROLLER
var controller = new Leap.Controller()

// THIS OBJECT CONTAINS ID-SERVOS ASSOCIATIONS
var idsToServos = {};

// THIS OBJECT CONTAINS DI-X_COORDINATES
var idsToStabilizedX = {};

// THIS OBJECT CONTAINS LATEST SERVOS ANGLES
var oldServoAngles = {};

// ASSIGN THIS VARIABLE TO ALL USEFUL FUNCTIONS LOADED WITH /lib/handToHand
handToHand = new handToHand();

controller.on("frame", function (frame) {

	var data = {
		thumb: 0,
		index: 0,
		middle: 0,
		ring: 0,
		pinkie: 0
	};

	// NUMBER OF DETECTED HANDS BY LEAP MOTION 
	var nHands = frame.hands.length;

	// IF THERE IS JUST 1 HAND
	if (tracking == 'true') {
		if (nHands == 1) {

			// RETRIEVE THE HAND OBJECT
			var hand = frame.hands[0];

			// RETRIEVE FINGER OBJECT
			var finger_obj = hand.fingers;

			// FIND THE NUMBER OF DETECTED FINGERS
			detectedFingers = finger_obj.length;

			// IF THERE ARE SOME DETECTED FINGERS
			if (detectedFingers > 0) {

				// IF THE ID-SERVOS OBJECT IS NOT VALID WE MUST RENEW IT
				if (handToHand.checkIdsToServos(finger_obj, idsToServos) == false) {

					// TO RENEW THE OBJECT WE NEED A FULL OPENED HAND
					if (detectedFingers == 5) {

						// FIRST WE CLEAN THE OBJECT
						delete idsToServos;
						idsToServos = {};

						// THEN WE RENEW IT
						idsToServos = handToHand.refreshIdsToServos(finger_obj);

						/* JUST SOME DEBUG
						for (var key in idsToServos) {
	 
						  var nome_servo = idsToServos[key];
						  var id_leap = key;
	 
						  console.log('ID: '+id_leap+', SERVO: '+nome_servo);
	 
						}
						*/

					} else
						console.log("Place your open hand to recalibrate the device!");

					// ELSE IF THE OBJECT IS VALID WE CAN PROCEED
				} else {

					// IF SOME FINGERS WERE NOT DETECTED THEN WE MUST SEARCH AND CLOSE THEM
					if (detectedFingers < 5) {

						// FIND AND CLOSE ABSENT FINGERS
						handToHand.closeAbsentFingers(finger_obj, idsToServos, data);

					}

					// NOW FOR EACH DETECTED FINGER
					for (var j = 0; j < detectedFingers; j++) {

						// ASSIGN THIS FINGER
						var this_finger = finger_obj[j];

						// RETRIEVE FINGER ID ASSIGNED BY LEAP MOTION
						var this_finger_id = this_finger.id;

						// RETRIEVE RELATED SERVO
						var servo = idsToServos[this_finger_id];

						// CALCULATING THE ANGLE BETWEEN THE PALM NORMAL AND FINGER DIRECTION
						var fingerAngle = handToHand.vectorAngle(hand.palmNormal, this_finger.direction).toFixed(0);

						// LET'S MOVE THE SERVO IF THE SENSIBILITY THRESHOLD IS EXCEEDED
						handToHand.moveFingerTo(data, fingerAngle, servo, oldServoAngles, servoSensibility);

					}

				}

			} else {

				// MAKE A FIST
				handToHand.punch(data);

				// CLEAN THE ID-SERVOS OBJECT
				delete idsToServos;
				idsToServos = {};
			}


		} else {

			// RELAX THE HAND AND SHOW THE ALERT
			handToHand.relax(data);
			console.log("Please, place one hand...");
		}
		io.emit('newdata', data);
	}

});

controller.on('device', function (frame) {
	var data = { servo: 0 };
	//var numberOfFingers = frame.fingers.length;
	if (frame.hands[0] != undefined && tracking == 'true') {
		//console.log(vectorAngle(frame.hands[0].direction,[0,1,0]));
		//for x [0,1,0]
		//for y [1,0,0]
		//var pozBiceps = vectorAngle(frame.hands[0].direction, [0, 1, 0]);
		var pozUmar = vectorAngle(frame.hands[0].direction, [1, 0, 0]);
		//console.log("biceps - " + map(pozBiceps, 10, 90, 8, 90));
		console.log("umar - " + pozUmar);
		data.servo = pozUmar;
	}
	//console.log(frame.hands[0].palmNormal + " " + frame.hands[0].fingers[1].direction);
	if (tracking == 'true')
		io.emit('newdata', data);
});

controller.on('connect', function () {
	console.log("Successfully connected.");
});

controller.on('deviceConnected', function () {
	console.log("A Leap device has been connected.");
});

controller.on('deviceDisconnected', function () {
	console.log("A Leap device has been disconnected.");
});

controller.connect();