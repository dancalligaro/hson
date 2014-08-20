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

var baseNode = {};
var nodesStack = [];
nodesStack.push(baseNode);

var m = theFile.match(openTagRE);

if(!m.length){
	throw "custom tag not found"
}

var base = m[0].match(tagBaseRE)[1];

console.log("Using tag prefix", base);

var lexer = new Lexer(function (char) {
    throw new Error("Unexpected character at row " + row + ", col " + col + ": " + char);
});

lexer.addRule(/\n/, function (it) {
	// console.log('detecting new line')
    tempString.push(it);
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
    //console.log('opening tag', token, tokenName);
    path.push(tokenName);
    // console.log('opening', path.join('>>>'));
    currentNode = tokenName;

	tempString = [];

    var newToken = { tokenName: tokenName };

    nodesStack[nodesStack.length-1].nodes = nodesStack[nodesStack.length-1].nodes || [];
    nodesStack[nodesStack.length-1].nodes.push(newToken);

    nodesStack.push(newToken);

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
        newToken.type = "array";
    } 

    //retPath.push(retCurr);

}, []);

lexer.addRule(new RegExp("</\\s*?" + base + "-.+?\\s*?>") , function (token) {
    //closing a node
    
    var tokenName = token.match(tagNameRE)[1];
    //console.log('closing tag', token, tokenName);


    if(currentNode != tokenName){
        throw "Invalid closing token: " + tokenName;
    }else{

        console.log('punta0', currentNode);
        console.log('punta1', nodesStack[nodesStack.length-1].tokenName);


        var last = nodesStack.pop();

        if(!last.nodes){ //No childs -> then it is a text node
            last.type = "text"; 
            last.text = tempString.join(''); 
        }

    	path.pop();
    	currentNode = path.length > 0 ? path[path.length-1] : null;
    	currMode = currMode.parent;
    	currMode.mode = currMode.mode || 'node';
        

    }

}, []);

lexer.input = theFile; 

lexer.lex();


//Build JSON structure;

console.log(nodesStack[0]);

var ss = buildJSObject(nodesStack[0]);

console.log(ss);

function buildJSObject(node){

    debugger;

    var obj = {};

    function goDeepArr(node){
        var i, r = [];
        for(i=0;i<node.nodes.length;i++){
            r.push(goDeep(node.nodes[i]));
        }
        return r;
    }

    function goDeep(node){
        var i, ret, n;
        if(node.nodes){
            ret = {};
            for(i=0;i<node.nodes.length;i++){
                n=node.nodes[i];
                ret[ n.tokenName ] = (n.type && n.type =="array") ? goDeepArr(n) : goDeep(n);
            }
        }else{
            //Text node
            ret = node.text;
        }
        return ret;
        
    }

    obj = goDeep(node);

    return obj;

}

debugger;