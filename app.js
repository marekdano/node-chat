// This is the main file of the chat app. It initializes a new express.js instance, all dependencies and listens on the port. App can be started by running "node app.js" in the terminal.

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path');

var PORT =  process.env.PORT || 3030;

var app = express()
  , server = http.Server(app);

app.configure(function (){
  app.set('port',PORT);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

// Initialize a new socket.io object. It is bound to 
// the express app, which allows them to coexist.
var io = require('socket.io')(server);

server.listen(app.get('port'), function (){
    console.log("Express server listening on port " + app.get('port'));
});

// Define chatroom

// usernames currently connected to the chatroom
var usernames = {},
    numUsers = 0;

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

