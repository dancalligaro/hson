var beautify = require('js-beautify').js_beautify;
var fs = require('fs');

var HSON = require("./parseHSON.js");

var theFile = fs.readFileSync('custom.hson').toString();

var obj = HSON.parse(theFile);

console.log(beautify(JSON.stringify(obj), { indent_size: 2 }));
