/*global require,module*/
var hsclasses = require("./node-homeseer/src/hs-classes.js");
var Device = hsclasses.Device;

var functions = {
    create: function(integrationid, devices) {
        var cd = devices[integrationid];
        var hd = {
            name: cd.name,
            location: cd.room,
            location2: cd.floor,
            type: "type",
            address: "caseta:" + integrationid,
            canDim: true,
            pairs: [
                {
                    status: {
                        value: 0,
                        text: "Off",
                        control: Device.StatusControl.Status | Device.StatusControl.Control,
                        use: Device.Use.Off,
                        render: Device.Render.Button,
                        includeValues: false,
                        location: {
                            row: 1,
                            column: 1
                        }
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
                        includeValues: false,
                        location: {
                            row: 1,
                            column: 2
                        }
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
                        includeValues: true,
                        location: {
                            row: 2,
                            column: 1,
                            span: 2
                        }
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
    query: function(caseta, integrationid) {
        caseta.query("OUTPUT", integrationid, 1);
    },
    set: function(caseta, integrationid, value) {
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
};

module.exports = functions;
