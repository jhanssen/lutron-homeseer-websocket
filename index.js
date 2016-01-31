/*global require*/

// ----- customize this -----

var devices = {
    2: {
        type: "dimmer",
        name: "Lights",
        room: "Hallway",
        floor: "2nd floor"
    }
};

// --------------------------

var hsclasses = require("./node-homeseer/src/hs-classes.js");
var Device = hsclasses.Device;
var homeseerHost = "pi.nine.ms:8087";
var hs = new hsclasses.Homeseer("ws://" + homeseerHost + "/homeseer");
var caseta = require("./caseta.js");
var deviceValues = undefined;
var hsdevs = Object.create(null);

var functions = {
    dimmer: require("./dimmer.js")
};

function createDevices() {
    var devs = [];
    for (var devid in devices) {
        var f = functions[devices[devid].type];
        var data = f.create(devid, devices);
        if (data !== undefined)
            devs.push(data);
    }
    hs.addDevices(devs, function(devs) {
        for (var i = 0; i < devs.length; ++i) {
            addDevice(devs[i]);
        }
    });
}

function addDevice(dev)
{
    hsdevs[dev.id] = dev;
    console.log("new dev", dev);
    dev.on("valueChanged", function(val) {
        console.log("dev updated", val);
        // val.device.value = val.value;
        // find in caseta and update
        var cidx = val.device.id.lastIndexOf(":");
        if (cidx !== -1) {
            var cid = parseInt(val.device.id.substr(cidx + 1));
            if (deviceValues[cid] === val.value)
                return;
            var cdev = devices[cid];
            var funcs = functions[cdev.type];
            funcs.set(caseta, cid, val.value);
        }
    });
    // if we have a device value, set it
    if (deviceValues !== undefined) {
        var cidx = dev.id.lastIndexOf(":");
        if (cidx !== -1) {
            var cid = parseInt(dev.id.substr(cidx + 1));
            if (cid in deviceValues) {
                dev.value = deviceValues[cid];
            }
        }
    }
}

function updateDevice(integrationid, value)
{
    var k = "websocket-caseta:" + integrationid;
    if (k in hsdevs) {
        var dev = hsdevs[k];
        dev.value = value;
    }
}

function queryDevices() {
    deviceValues = Object.create(null);
    for (var devid in devices) {
        var f = functions[devices[devid].type];
        f.on(devid, "value", function(devid, value) {
            console.log("device value", devid, value);
            deviceValues[devid] = value;
            updateDevice(devid, value);
        });
        f.query(caseta, devid);
    }
}

hs.on("ready", function() {
    console.log("hs ready");
    createDevices();
});
hs.on("request", function(req) {
    console.log("hs req", req);
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
    }
});
caseta.connect({ host: "192.168.1.120",
                 port: 23,
                 login: "lutron",
                 password: "integration" });
