/* This is the server side of the chat app */ 

var _ = require('underscore');

// people are currently connected to the chatroom
var peopleInChat = {};
var chatRooms = [];

module.exports = function(app, io) {
  
  // Define chatroom
  io.on('connection', function(socket){
    
    socket.on('createRoom', function(roomName){
		
		//var sample = [{"family": { people: { 1: "marek", 2: "eva"}}, 
		//				{"work": { people: { 12: "emma", 23: "laura"}}]; 
		var alredyExistsMessage = null;
		
		// if the room is already existed
		if(containsRoom(roomName)) {
			console.log('Room already exists.');
			alredyExistsMessage = "This room already exists!";
		} else {
			// create and add a new room to the list of all rooms
			//var room = {roomname: roomName, people: []};
			var room = {};
			room[roomName] = { people: {}};

			chatRooms.push(room);
			console.log("New room has added to chatRooms " + chatRooms);
			console.log(chatRooms);
		}
		
		// log the host name e.g. localhost:3030
		console.log(socket.handshake.headers.host)
		socket.emit('create', socket.handshake.headers.host + '/' + roomName, alredyExistsMessage);
	
	});  
	  
	// when the client emits 'login', this listens and executes
	// save username and avatar, and add them to the room 
	socket.on("join", function(name, createdRoom) {
		// we store the username in the socket session for this username
		// we picked this approach intead of "socket.id"
		//socket.id = name;
		console.log("Socket - name of user: " + socket.id);
		console.log("Room name: " + createdRoom);
		
		//peopleInChat[socket.id] = name;
		addPersonToRoom(createdRoom, socket, name);
		//room.people = peopleInChat; 	
		
		// this will be emitted just to the socket that join the chat 
		socket.emit("update", "You have connected to the chatroom.");
		// broadcasting means sending a message to everyone else except for 
		// the socket that starts it
		socket.broadcast.emit("update", name + " has joined the chatroom.");

		// update the number of online usernames and their names
		if(!(_.isEmpty(peopleInChat))) {
			io.sockets.emit("update-chatPeople", peopleInChat);
		}
		console.log(chatRooms);
	});  
       
    // when the client send a "chat message"   
	socket.on("chat message", function(msg){
      
		console.log("Username: " + peopleInChat[socket.id]);
		// this message is displayed to everyone 
		io.emit("chat message", peopleInChat[socket.id], msg);
	});
      
	// when a user leaves the chat room  
	socket.on("disconnect", function() {
		if (peopleInChat[socket.id]) {
			// this is broadcasting to everyone else ecsept for the socket that starts it 
			socket.broadcast.emit("update", peopleInChat[socket.id] + " has left the chatroom");
			console.log("Person ID" + peopleInChat[socket.id]);
			delete peopleInChat[socket.id];
			// update the number and usernames who are online
			io.sockets.emit("update-chatPeople", peopleInChat);
		}
	});  
  });
	
  // Help function to find if the room exists.
  // returns true if it exist	
  function containsRoom (roomName) {
  	return _.contains(_.flatten(_.map(chatRooms, function(item) {
  				var key = _.keys(item);
  				console.log("key: " + key);
				return key;
			})), roomName);
  }

  function addPersonToRoom (room_name, socket, person_name) {
  	var socketID = socket.id;
  	var room = undefined;
  	for (var i=0; i<chatRooms.length; i++) {
  		room = chatRooms[i];
  		console.log(room);
  		console.log(room[room_name]);
  		console.log(room[room_name].people);
  		room[room_name].people.socketID = person_name;

  	}
  }

  app.get('/', function(req, res) {
	res.render('index');
  });
	
  /*
  app.post('/create', function(req, res) {
	roomName = req.body.roomName; 
  	console.log(req.body);
	console.log('req received');
	var newurl = req.url.slice(0, req.url.indexOf('?'));
	console.log(req.get('host') + newurl); 
	console.log(req.get('host') + '/' + roomName);  
	//socket.emit('create', req.get('host') + '/' + roomName);
  });
  */

  app.get('/:roomName', function(req, res) {
	var roomUrl = req.url.slice(1);
	if (containsRoom(roomUrl)) {
		res.render('index');
	} else {
		res.send("This room doesn't exist. Please try this address " + "\"" +req.get('host') + "\"");
	}
  });
};