
var _ = require('underscore');

// people are currently connected to the chatroom
var peopleInChat = {};

module.exports = function(app, io) {
  
  // Define chatroom
  io.on('connection', function(socket){
    
    // when the client emits 'login', this listens and executes
    // save username and avatar, and add them to the room 
    socket.on("join", function(name) {
      // we store the username in the socket session for this username
      // we picked this approach intead of "socket.id"
      socket.username = name;
      console.log("Socket - name of user: " + socket.name);
      peopleInChat[socket.username] = name;
      // this will be emitted just to the socket that join the chat 
      socket.emit("update", "You have connected to the chatroom.");
      // broadcasting means sending a message to everyone else except for 
      // the socket that starts it
      socket.broadcast.emit("update", name + " has joined the chatroom.");
      
      // update the number and usernames who are online
      if(!(_.isEmpty(peopleInChat))) {
        io.sockets.emit("update-chatPeople", peopleInChat);
      }
    });  
       
    // when the client send a "chat message"   
    socket.on("chat message", function(msg){
      
      console.log("Username: " + peopleInChat[socket.username]);
      // this message is displayed to everyone 
      io.emit("chat message", peopleInChat[socket.username], msg);
  	});
      
    // when a user leaves the chat room  
    socket.on("disconnect", function() {
      // this is broadcasting to everyone else ecsept for the socket that starts it 
      socket.broadcast.emit("update", peopleInChat[socket.username] + " has left the chatroom");
      delete peopleInChat[socket.username];
      // update the number and usernames who are online
      io.sockets.emit("update-chatPeople", peopleInChat);
    });  
  });

  app.get('/', function(req, res) {
  	res.render('index');
  });
};