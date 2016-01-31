/*global require*/

var caseta = require("./caseta.js");
var devices = undefined;

caseta.on("OUTPUT", function(args) {
    console.log("output: ", args);
});
caseta.on("ready", function() {
    if (devices === undefined) {
        caseta.query("OUTPUT", 2, 1);
        caseta.set("OUTPUT", 2, 1, 80);
        devices = true;
    }
});
caseta.connect({ host: "192.168.1.120",
                 port: 23,
                 login: "lutron",
                 password: "integration" });
