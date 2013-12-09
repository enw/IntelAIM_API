var net = require('net'),
  buffer = require('buffer');

/*
  MessageHeader Structure

  2b - 0xFACE - simple code to validate that mesage was received successfully
  1b - 0x01 - version
  1b - variable - type of data (message command or message event)
  1b - variable - payload size of data that follows header
*/

// CONSTATNTS
var PORT = 12500,
  HOST='think-a';
//  HOST='think-b';

// POLLING MS
var POLL_MS = 10000;

// MESSAGE TYPES
var GET_AUDIENCE_STATUS=0,
  GET_AUDIENCE_DETAILS=1,
  GET_VIEWER_EVENTS=5,
  EVENT_ACK = 128,
  EVENT_NACK = 129,
  EVENT_AUDIENCE_STATUS = 130,
  EVENT_AUDIENCE_DETAILS = 131,
  EVENT_MAJORITY_GENDER = 132,
  EVENT_VIEWER = 135;

// GENDER AND AGE MAPS
var genderMap = {
  0: 'unknown',
  1: 'male',
  2: 'female'
},
  ageMap = {
    0: 'unknown',
    1: 'child (under 16)',
    2: 'teenager',
    3: 'young adult (16-34)',
    4: 'older adult (35-64)',
    5: 'senior (65+)'
  },
  eventTypeMap = {
    0: 'START',
    2: 'END'
  };

// helper to write
function getAudienceStatusPacket() {
  var packet = new Buffer(5);
  packet[0]=0xFA;
  packet[1]=0xCE;
  packet[2]=0x01;
  packet[3]=GET_AUDIENCE_STATUS;
  packet[4]=0x00;
  return packet;
}
function getAudienceDetailsPacket() {
  var packet = new Buffer(5);
  packet[0]=0xFA;
  packet[1]=0xCE;
  packet[2]=0x01;
  packet[3]=GET_AUDIENCE_DETAILS;
  packet[4]=0x00;
  return packet;
}
function getViewerEventStreamPacket() {
  var packet = new Buffer(6);
  packet[0]=0xFA;
  packet[1]=0xCE;
  packet[2]=0x01;
  packet[3]=GET_VIEWER_EVENTS;
  packet[4]=0x01;
  packet[5]=0x01; // 1 is start sending, 0 is stop sending
  return packet;
}


function getViewerEventStream() {
  stream_socket.write(getViewerEventStreamPacket());
}

// helper for testing
function pollForViewers() {
  socket.write(getAudienceStatusPacket());

  var iid = setInterval(function () {
      socket.write(getAudienceDetailsPacket());
    }, POLL_MS);
}

function getPayload(packet) {
  return packet.slice(5);
}


function getViewerDetail(blist, offset) {
  var RECORD_SIZE = 20,
    OFFSET = offset * RECORD_SIZE,
    ID_OFFSET = 0,
    GENDER_OFFSET = 4,
    AGE_OFFSET = 5,
    VIEWINGTIME_OFFSET = 7,
    gender = blist[OFFSET+GENDER_OFFSET],
    age = blist[OFFSET+AGE_OFFSET],
    viewerID = blist.readUInt32BE(OFFSET + ID_OFFSET),
    viewingTime =  blist.readInt32BE(OFFSET+VIEWINGTIME_OFFSET);
  return {
    id : viewerID,
    gender : genderMap[gender],
    age : ageMap[age],
    viewingTime : viewingTime
  };
}

function parseEventViewer(packet) {
  var type=packet[0],
    typeString = eventTypeMap[type];

  console.log("***","ViewerEvent",typeString, getViewerDetail(packet.slice(1),0) );
}

function parseAudienceDetails(packet) {
  var count = packet[0];
  if (count>1) console.log(count, 'viewers viewing');

  for (var i=0;i<count;i++) {
    var viewerDetail = getViewerDetail(packet.slice(1),i);
    console.log("---","Audience Details Event",viewerDetail);
  }
}

function parseAIMPacket(packet) {
  var type = packet[3],
    payloadSize = packet[4];

  switch (type) {
      case EVENT_AUDIENCE_STATUS:
        var count = packet[5];
        console.log('viewer count', count);
        break;
      case EVENT_AUDIENCE_DETAILS:
        parseAudienceDetails(getPayload(packet));
        break;
      case EVENT_ACK:
        console.log('ACK - AIM hears you');
        break;
      case EVENT_NACK:
        console.log('NACK - last call failed');
        break;
      case EVENT_VIEWER:
        parseEventViewer(getPayload(packet));
        break;
      default:
        console.log('UNHANDLED MESSAGE', type, packet);
  }
}

// create socket object for polling
var socket = net.connect(
                         { host:HOST, port:PORT },
                         function() {
                           console.log('client connected');
                           pollForViewers();
                         });
socket.on('data', function(d) {
    parseAIMPacket(d);
  });
socket.on('end', function() {
    console.log('client disconnected');
  });

// create socket for listening to eventstream
var stream_socket = net.connect(
                         { host:HOST, port:PORT },
                         function() {
                           console.log('stream client connected');
                           getViewerEventStream();
                         });
stream_socket.on('data', function(d) {
    parseAIMPacket(d);
  });
stream_socket.on('end', function() {
    console.log('streamclient disconnected');
  });
