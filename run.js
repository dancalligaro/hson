fs = require('fs');

var HSON = require("./parseHSON.js");

var theFile = fs.readFileSync('custom.hson').toString();

var obj = HSON.parse(theFile);



console.log("===============");

console.log(JSON.stringify(obj));