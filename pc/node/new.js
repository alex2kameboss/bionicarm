//calculeaza unghiul pentru degete folosind vectorul osului metacarpian si vectorul falangei intermediare

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
class robotHand{
    fingerAngle(finger){

        if(finger == undefined)
            return 0;

        var bone1 = finger.metacarpal.direction();
        var bone2 = finger.medial.direction();

        var dotProduct = bone1[0]*bone2[0] + bone1[1]*bone2[1] + bone1[2]*bone2[2];
        var palmModule = Math.sqrt(bone1[0]*bone1[0] + bone1[1]*bone1[1] + bone1[2]*bone1[2]);
        var fingerModule = Math.sqrt(bone2[0]*bone2[0] + bone2[1]*bone2[1] + bone2[2]*bone2[2]);
    
        var angle = Math.acos(dotProduct/(palmModule*fingerModule))*180/Math.PI;
        
        return Math.round(angle);
    }

    thumbAngle(finger){

        if(finger == undefined)
            return 0;

        var bone1 = finger.metacarpal.direction();
        var bone2 = finger.distal.direction();

        var dotProduct = bone1[0]*bone2[0] + bone1[1]*bone2[1] + bone1[2]*bone2[2];
        var palmModule = Math.sqrt(bone1[0]*bone1[0] + bone1[1]*bone1[1] + bone1[2]*bone1[2]);
        var fingerModule = Math.sqrt(bone2[0]*bone2[0] + bone2[1]*bone2[1] + bone2[2]*bone2[2]);
    
        var angle = Math.acos(dotProduct/(palmModule*fingerModule))*180/Math.PI;
        
        return Math.round(angle);
    }

    map(x, in_min, in_max, out_min, out_max) {
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

    move(hand){
        var ret = {
            thumb : Math.round(this.map(this.thumbAngle(hand.thumb),20,130,0,150))-10,
            index : this.fingerAngle(hand.indexFinger),
            middle : this.fingerAngle(hand.middleFinger),
            ring : this.fingerAngle(hand.ringFinger),
            pinkie : this.fingerAngle(hand.pinky)+10,
			palm: this.palm(hand.palmNormal),
			biceps: this.biceps(hand.direction),
			umar: this.umar(hand.direction) 
        };

        console.log(ret);

        return ret;
    }

    nothing(){
        console.log("Show righ hand");
    }

    vectorAngle(palm, finger) {
        //console.log(finger);
        var dotProduct = palm[0] * finger[0] + palm[1] * finger[1] + palm[2] * finger[2];
        var palmModule = Math.sqrt(palm[0] * palm[0] + palm[1] * palm[1] + palm[2] * palm[2]);
        var fingerModule = Math.sqrt(finger[0] * finger[0] + finger[1] * finger[1] + finger[2] * finger[2]);
    
        var angle = Math.acos(dotProduct / (palmModule * fingerModule)) * 180 / Math.PI;
    
        return angle;
    }

	biceps(direction){
		var pozBiceps = this.vectorAngle(direction, [0, 1, 0]);
		pozBiceps = 90-pozBiceps;
        if (pozBiceps > 90)
            pozBiceps = 90;
        else if (pozBiceps < 8)
            pozBiceps = 8;
		
		return Math.round(pozBiceps);
	}

	umar(direction){
		var pozUmar = this.vectorAngle(direction, [1, 0, 0]);

        return Math.round(pozUmar);
	}

    palm(palm){
        var pozPalm = this.vectorAngle(palm, [0, 1, 0]);
        pozPalm = 70 - this.map(pozPalm,90,160,0,70);

        return Math.round(pozPalm);
    }
}

var robot = new robotHand();

var leapJS = require('leapjs');
var controller = new leapJS.Controller();

controller.on("deviceFrame", function (frame) {

	var data = {
		thumb: 0,
		index: 0,
		middle: 0,
		ring: 0,
        pinkie: 0,
		palm: 0,
		biceps: 8,
		umar: 90
	};

    //console.log(frame);

	if (tracking == 'true') {
        var handsNumber = frame.hands.length;
        if(handsNumber == 1){
            var hand = frame.hands[0];
            //console.log(hand);
            data = robot.move(hand);
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
