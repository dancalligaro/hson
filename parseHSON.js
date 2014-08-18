Lexer = require('lex');
fs = require('fs');

var path = [];
var currentNode = null;

//Mode can be text, node or array
var modeObj = {
	mode: 'node'
}; 

var currMode = modeObj;

var retObj = {};
var retPath = [];
var retCurr = retObj;

var row = 1;
var col = 1;

var theFile = fs.readFileSync('custom.hson').toString();

//First, detect the basename for the tags

var openTagRE = /<[^!\/]\s*?(.+?)\-.+?\s*?>/;
var tagBaseRE = /<\s*?(.+?)\-.+?\s*?>/;
var tagNameRE = /<\/?\s*?.+?\-(.+?)\s*?>/;
var arrTagRE = /^arr-/;
var arrItemTagRE = /^item$/;

var tempString = [];


var m = theFile.match(openTagRE);

if(!m.length){
	throw "custom tag not found"
}

var base = m[0].match(tagBaseRE)[1];

console.log("Using tag prefix", base);

var lexer = new Lexer(function (char) {
    throw new Error("Unexpected character at row " + row + ", col " + col + ": " + char);
});

lexer.addRule(/\n/, function () {
	// console.log('detecting new line')
    row++;
    col = 1;
}, []);


lexer.addRule(/\s/, function (it) {
    //this.reject = true;
    // console.log('advancing sp', it)
    tempString.push(it);
    col++;
}, []);

lexer.addRule(/./, function (it) {
    //console.log('advancing char', it)

    tempString.push(it);

    if( currMode.mode != 'text' ){
    	if( typeof currMode.mode == 'undefined' ){
    		currMode.mode = "text";
    	}else{
    		throw "Invalid text inside a node type " + currMode.mode;
    	}
    }
	
	col++;
    //this.reject = true; 
}, []);

lexer.addRule(/<!--.*?-->/, function (hola) {
    console.log('comment', hola)
}, []);

lexer.addRule(new RegExp("<\\s*?" + base + "-.+?\\s*?>"), function (token) {
	
    //opening a node
	var tokenName = token.match(tagNameRE)[1];
    console.log('opening tag', token, tokenName);
    path.push(tokenName);
    currentNode = tokenName;

	tempString = [];

    //Check parents mode if inside an array 
    if( currMode.mode == 'array' && !arrItemTagRE.test(tokenName) ){
    	throw "Invalid token inside an array: " + tokenName;
    }

    //Check parents mode, if inside a text node
    if( currMode.mode == 'text' ){
    	throw "Invlid token inside a text node: " + tokenName;
    }

    currMode = currMode['-' + tokenName] = { parent: currMode };

    if( arrTagRE.test(tokenName) ){
    	// if this is an array, then set this mode to array
    	currMode.mode = "array";
    } 

    //retPath.push(retCurr);

}, []);

lexer.addRule(new RegExp("</\\s*?" + base + "-.+?\\s*?>") , function (token) {
    //closing a node
    
    var tokenName = token.match(tagNameRE)[1];
    console.log('closing tag', token, tokenName);

    if(currentNode != tokenName){
    	throw "Invalid closing token: " + tokenName;
    }else{



    	path.pop();
    	currentNode = path.length > 0 ? path[path.length-1] : null;
    	currMode = currMode.parent;
    	currMode.mode = currMode.mode || 'node';
    }

}, []);

lexer.input = theFile; 

lexer.lex();

