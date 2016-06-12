var http = require('http')
var assert = require('assert');
var fs = require('fs');
var path = require('path')
var os = require('os')

var port = process.env.PORT || 3700;
var clients = [];
var randomData = [];
var maxRandomData = 500;
var lastMessageReceived = new Date().getTime();
var seedEmitDelay = 5000;
var DEBUG = process.env.NODE_ENV == 'development';


var app = http.createServer(function (request, response) {
    DEBUG && console.log('New request: %s',request.url);
    var filePath = request.url;

    if(filePath == '/api/seed'){
            response.writeHead(200, { 'Content-Type':  'application/json' });
            response.end('{seed:' + seed() + '}', 'utf-8');
    }else{
        // The following http handler is in place to serve static content
        // It is not required if you are hosting the files
        if (filePath == '/')
            filePath = 'home.html';
        // every static file is served under the static directory as a basic protection
	   file_content('static/' + filePath, response);
    }
}).listen(port);


var io = require('socket.io')(app);


io.sockets.on('connection', function (socket) {
	console.info('Client connected ' + socket.id);
    socket.seedStream = true;
    clients.push(socket);
    socket.on('send', function (data) {
    	// ignore non numbers
    	if(!isNaN(data.message)){
    		randomData.push(data.message);
        	lastMessageReceived = new Date().getTime()
        	DEBUG && console.log('new message received: ' + data.message );
        	if(randomData.length > maxRandomData ){
        		DEBUG && console.log('reached max size for data, deleting ' + Math.floor(randomData.length / 2) + ' random entires');
        		for (var x = 0; x <= Math.floor(randomData.length / 2); x++){
        			randomData.splice(Math.floor(Math.random() * randomData.length), 1);
        		}
        		
        	}
    	}
    });
    socket.on('clientStatus', function (data) {
    	if(data.seedStream){
        	socket.seedStream = true;
        	DEBUG && console.log('Client resumed' );
    	}else{
    		socket.seedStream = false;
    		DEBUG && console.log('Client paused' );
    	}
    });
    socket.on('disconnect', function() {
        var index = clients.indexOf(socket);
        if (index != -1) {
            clients.splice(index, 1);
            console.info('Client disconnect ' + socket.id);
        }
    });

});

// This interval is responsible for sending data to clients as well as handling
// cases where we don't have enough data available
setInterval(function(){
    DEBUG && console.log('Number of connected clients:  %s', io.engine.clientsCount);
	for (i = 0; i < clients.length; i++) { 
		if (!clients[i].seedStream) continue;
	    	clients[i].emit('message', {message: seed() });
   	    	DEBUG && console.log('Data sent');
    }
}, seedEmitDelay);

var seed = function(){
    if(randomData.length == 0 && new Date().getTime() - lastMessageReceived > 300){//5000
        DEBUG && console.log('Not enough data, random created');
        return Math.floor(Math.random()*1000000000, 10);
    }else if(randomData.length > 0){
        return randomData.shift();
    }

}
// file_content is a helper function to serve static content 
var file_content = function(fname,res){
		fs.exists(fname, function( exists ) {
        if (exists) {
            fs.readFile(fname, function(error, content) {
                if (error) {
                    res.writeHead(500);
                    res.end();
                }else {
                	// we only added filetypes that we are using, so if you will use 
                	// assets that aren't here you should add the appropriate mime types
			   		var contentType = 'text/html';
				    switch (path.extname(fname)) {
				    	case '.png':
				    		contentType = 'image/png';
				    		break;
				        case '.js':
				            contentType = 'text/javascript';
				            break;
				        case '.css':
				            contentType = 'text/css';
				            break;
				    }
                    res.writeHead(200, { 'Content-Type':  contentType });
                    res.end(content, 'utf-8');
                }
            });
        }else {
            res.writeHead(404);
            res.end();
        }
    });
}