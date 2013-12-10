/*jslint node: true */
"use strict";

///
// DEPENDENCIES
///
var net = require('net'),
    buffer = require('buffer'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

///
// DEFAULTS
///
var PORT = 12500,
    //    HOST = 'think-a',
    HOST='think-b',
    //  HOST='10.119.93.152',

    // POLLING MS
    POLL_MS = 1000;

// MESSAGE TYPES
var GET_AUDIENCE_STATUS = 0,
    GET_AUDIENCE_DETAILS = 1,
    GET_VIEWER_EVENTS = 5,
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
    packet[0] = 0xFA;
    packet[1] = 0xCE;
    packet[2] = 0x01;
    packet[3] = GET_AUDIENCE_STATUS;
    packet[4] = 0x00;
    return packet;
}
function getAudienceDetailsPacket() {
    var packet = new Buffer(5);
    packet[0] = 0xFA;
    packet[1] = 0xCE;
    packet[2] = 0x01;
    packet[3] = GET_AUDIENCE_DETAILS;
    packet[4] = 0x00;
    return packet;
}
function getViewerEventStreamPacket(bool) {
    var packet = new Buffer(6);
    packet[0] = 0xFA;
    packet[1] = 0xCE;
    packet[2] = 0x01;
    packet[3] = GET_VIEWER_EVENTS;
    packet[4] = 0x01;
    packet[5] = (bool)?0x01:0x00; // 1 is start sending, 0 is stop sending
    return packet;
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

    return {type:typeString, viewer:getViewerDetail(packet.slice(1),0)};
}

function parseAudienceDetails(packet) {
    var count = packet[0],
        viewers=[];

    //  if (count>1) console.log(count, 'viewers viewing');
    console.log(count, 'viewers viewing');

    for (var i=0;i<count;i++) {
        var detail =
            viewers.push(getViewerDetail(packet.slice(1),i));
        //    console.log("---","Audience Details Event",viewerDetail);
    }
    return viewers;
}

// NAIM object
function Naim () {
    EventEmitter.call(this);

    var host, port,
        socket, stream_socket,
        naim = this,
        emit = this.emit;

    // helper for testing
    function pollForViewers() {
        socket.write(getAudienceStatusPacket());

        var iid = setInterval(function () {
            socket.write(getAudienceDetailsPacket());
        }, POLL_MS);
    }

    //
    var _getAudienceDetailsCallbacks = [];
    this.getAudienceDetails = function (done) {
        _getAudienceDetailsCallbacks.push(done);
        socket.write(getAudienceDetailsPacket());
    }

    // assumed always to succeed
    // also assumes responses will come back serially
    var _getAudienceCountCallbacks = [];
    this.getAudienceCount = function (done) {
        _getAudienceCountCallbacks.push(done);
        socket.write(getAudienceStatusPacket());
    };

    // internal parser
    function _parseAIMPacket(packet) {
        var type = packet[3],
            payloadSize = packet[4];

        switch (type) {
                // response to user status call
            case EVENT_AUDIENCE_STATUS:
                var count = packet[5];
                _getAudienceCountCallbacks.shift()(null, count);
                break;
            case EVENT_AUDIENCE_DETAILS:
                var details = parseAudienceDetails(getPayload(packet));
                _getAudienceDetailsCallbacks.shift()(null, details);
                break;
            case EVENT_ACK:
                naim.emit('ACK');
                break;
            case EVENT_NACK:
                naim.emit("NACK");
                console.log('NACK - last call failed');
                break;
            case EVENT_VIEWER:
                var data = parseEventViewer(getPayload(packet));
                naim.emit("EVENT_VIEWER", data);
                break;
            default:
                console.log('UNHANDLED MESSAGE', type, packet);
        }
    }

    this.listen = function (bool) {
        socket.write(getViewerEventStreamPacket(bool));
    }
        
    // @param host (optional)
    // @param port (optional)
    this.connect = function(host, port, done) {
        host = (arguments[0])?arguments[0]:HOST;
        port = (arguments[1])?arguments[1]:PORT;

        // create socket object for polling
        socket = net.connect(
            { host:HOST, port:PORT }, done);
        socket.on('data', function(d) {
            _parseAIMPacket(d);
        });
        socket.on('end', function() {
            console.log('client disconnected');
        });
        socket.on('error', function(err) {
            console.log('client error',err);
        });

        console.log('connecting to', HOST, ":", PORT);
    }
}
util.inherits(Naim, EventEmitter);

module.exports = new Naim();
