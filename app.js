// This is the main file of the chat app. It initializes a new express.js instance, 
// all dependencies and listens on the port. App can be started by running 
// "node app.js" or grunt in terminal.

var express = require('express'),
    http = require('http');

/*
// This are samples for using exports modules in the syntax "exports.name_of_module" 
// scaffolded from yeoman express generator. There are not used in this app. 
// This is for purposes of learnig node app.
// Required files are under router folder.
var samples = require('./routes/sample.js'),
    user = require('./routes/user');
*/

var PORT =  process.env.PORT || 3030;

var app = express(),
    server = http.Server(app);

// setting up the express app using the JADE template engine
app.configure(function (){
  app.set('port',PORT);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Initialize a new socket.io object. It is bounded to 
// the express app, which allows them to coexist.
var io = require('socket.io')(server);

/*
// This the samples for using exports modules in the syntax "exports.name_of_module" 
// and routing some path samples. This is not used in the app.
app.get('/hello', samples.index);
app.get('/user', user.list);
app.get('/try', samples.sendToExample);
*/

// load the server side of the chat app
require('./routes/chat-server')(app, io);

server.listen(app.get('port'), function (){
    console.log("Express server listening on port " + app.get('port'));
});

