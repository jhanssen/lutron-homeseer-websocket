/*global require*/

var hsclasses = require("./node-homeseer/src/hs-classes.js");
var Device = hsclasses.Device;
var homeseerHost = "pi.nine.ms:8087";
var hs = new hsclasses.Homeseer("ws://" + homeseerHost + "/homeseer");
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
var hsdevs = Object.create(null);

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
                pairs: [
                    {
                        status: {
                            value: 0,
                            text: "Off",
                            control: Device.StatusControl.Status | Device.StatusControl.Control,
                            use: Device.Use.Off,
                            render: Device.Render.Button,
                            includeValues: false
                        },
                        graphic: {
                            value: 0,
                            graphic: "/images/HomeSeer/status/off.gif"
                        }
                    },
                    {
                        status: {
                            value: 100,
                            text: "On",
                            control: Device.StatusControl.Status | Device.StatusControl.Control,
                            use: Device.Use.On,
                            render: Device.Render.Button,
                            includeValues: false
                        },
                        graphic: {
                            value: 100,
                            graphic: "/images/HomeSeer/status/on.gif"
                        }
                    },
                    {
                        status: {
                            value: [1, 99],
                            text: {
                                prefix: "Dim ",
                                suffix: "%"
                            },
                            control: Device.StatusControl.Status | Device.StatusControl.Control,
                            use: Device.Use.Dim,
                            render: Device.Render.ValuesRangeSlider,
                            includeValues: true
                        },
                        graphic: [
                            {
                                value: [1, 5.99999999],
                                graphic: "/images/HomeSeer/status/dim-00.gif"
                            },
                            {
                                value: [6, 15.99999999],
                                graphic: "/images/HomeSeer/status/dim-10.gif"
                            },
                            {
                                value: [16, 25.99999999],
                                graphic: "/images/HomeSeer/status/dim-20.gif"
                            },
                            {
                                value: [26, 35.99999999],
                                graphic: "/images/HomeSeer/status/dim-30.gif"
                            },
                            {
                                value: [36, 45.99999999],
                                graphic: "/images/HomeSeer/status/dim-40.gif"
                            },
                            {
                                value: [46, 55.99999999],
                                graphic: "/images/HomeSeer/status/dim-50.gif"
                            },
                            {
                                value: [56, 65.99999999],
                                graphic: "/images/HomeSeer/status/dim-60.gif"
                            },
                            {
                                value: [66, 75.99999999],
                                graphic: "/images/HomeSeer/status/dim-70.gif"
                            },
                            {
                                value: [76, 85.99999999],
                                graphic: "/images/HomeSeer/status/dim-80.gif"
                            },
                            {
                                value: [86, 95.99999999],
                                graphic: "/images/HomeSeer/status/dim-90.gif"
                            },
                            {
                                value: [96, 99],
                                graphic: "/images/HomeSeer/status/on.gif"
                            },
                        ]
                    }
                ]
            };
            return hd;
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
    var devs = [];
    for (var devid in devices) {
        var f = functions[devices[devid].type];
        var data = f.create(devid);
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
            var cdev = devices[cid];
            var funcs = functions[cdev.type];
            funcs.set(cid, val.value);
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
        f.query(devid);
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
        // caseta.query("OUTPUT", 2, 1);
        // caseta.set("OUTPUT", 2, 1, 80);
        // devicesValues = true;
    }
});
caseta.connect({ host: "192.168.1.120",
                 port: 23,
                 login: "lutron",
                 password: "integration" });
