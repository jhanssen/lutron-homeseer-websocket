/*global require*/

var WebSocket = require("faye-websocket");
var homeseerHost = "pi.nine.ms:8087";
var ws = new WebSocket.Client("ws://" + homeseerHost + "/homeseer");
var wsOpen = false;
var caseta = require("./caseta.js");
var deviceValues = undefined;
var devices = {
    2: {
        type: "dimmer",
        name: "Lights",
        room: "Hallway",
        floor: "2nd floor"
    }
};

var functions = {
    dimmer: {
        create: function(integrationid) {
            var cd = devices[integrationid];
            var hd = {
                name: cd.name,
                location: cd.room,
                location2: cd.floor,
                type: "type",
                address: "caseta:" + integrationid,
                code: integrationid,
                pairs: [
                    {
                        status: {
                            value: 0,
                            text: "Close"
                        }
                    }
                ]
            };
        },
        query: function(integrationid) {
            caseta.query("OUTPUT", integrationid, 1);
        },
        set: function(integrationid, value) {
            caseta.set("OUTPUT", integrationid, 1, value);
        },
        on: function(integrationid, type, cb) {
            this._ons[integrationid + ":" + type] = cb;
        },

        _call(integrationid, type, value) {
            var k = integrationid + ":" + type;
            if (k in this._ons && typeof this._ons[k] === "function")
                this._ons[k](integrationid, value);
        },
        _ons: Object.create(null)
    }
};

function createDevices() {
    for (var devid in devices) {
        var f = functions[devices[devid].type];
        var data = f.create(devid);

    }
}

function updateDevice(integrationid, value)
{
}

function queryDevices() {
    deviceValues = Object.create(null);
    for (var devid in devices) {
        var f = functions[devices[devid].type];
        f.on(devid, "value", function(devid, value) {
            console.log("device value", devid, value);
            deviceValues[devid] = value;
            if (wsOpen)
                updateDevice(devid, value);
        });
        f.query(devid);
    }
}

ws.on("open", function() {
    console.log("ws open");
    wsOpen = true;
    createDevices();
});

caseta.on("OUTPUT", function(args) {
    //console.log("output: ", args);
    if (args[1] === "1") {
        var intg = parseInt(args[0]);
        var dev = devices[intg].type;
        functions[dev]._call(intg, "value", parseFloat(args[2]));
    }
});
caseta.on("ready", function() {
    if (deviceValues === undefined) {
        queryDevices();
        // caseta.query("OUTPUT", 2, 1);
        // caseta.set("OUTPUT", 2, 1, 80);
        // devicesValues = true;
    }
});
caseta.connect({ host: "192.168.1.120",
                 port: 23,
                 login: "lutron",
                 password: "integration" });
