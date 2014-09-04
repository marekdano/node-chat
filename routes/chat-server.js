/* This is the server side of the chat app */ 

var _ = require('underscore');

// people are currently connected to the chatroom
var chatRooms = [];
var people = {};
// getting room name from the URL path (e.g. '/family')
var roomUrl = null;

module.exports = function(app, io) {
  
  // Define chatroom
  io.on('connection', function(socket){
    
    socket.on('createRoom', function(roomName){
		// the format of the chatRooms variable 
		// [{roomname: "family", people: { 1: "marek", 2: "eva"}}, 
		//	{roomname: "work", people: { 12: "emma", 23: "laura"}}]
		// 
		var alredyExistsMessage = null;
		
		// if the room is already existing
		if(containsRoom(roomName)) {
			console.log('Room already exists.');
			alredyExistsMessage = "This room already exists!";
		} else {
			// create and add a new room to the list of all rooms
			// {roomname: roomName, people: {}};
			var room = {};
			room.roomname = roomName;
			room.people = {};

			chatRooms.push(room);
			roomUrl = roomName;

			console.log("New room has added to chatRooms " + roomName);
		}
		
		// get host name using: socket.handshake.headers.host (e.g. localhost:3030)
		socket.emit('create', socket.handshake.headers.host + '/' + roomName, alredyExistsMessage);

		console.log(chatRooms);
	
	});  
	  
	// when the client emits 'login', this listens and executes
	// save username, and add it to the room 
	socket.on("join", function(name, existingRoom) {
		
		// if the chat room is accessed from url (e.g. localhost:3030/family)
		if (existingRoom === null) {
			existingRoom = roomUrl;
		}

		console.log("New person JOIN the room name: " + existingRoom);
		
		// store the room name in the socket session for this client 
		socket.room = existingRoom;

		// send client to the existing room
		socket.join(existingRoom);
		
		// add the new person to the room
		addPersonToRoom(existingRoom, socket.id, name);	
		
		// this will be emitted just to the socket that join the chat 
		socket.emit("update", "You have connected to the chatroom.");
		// broadcasting means sending a message to everyone else except for 
		// the socket that starts it
		socket.broadcast.to(existingRoom).emit("update", name + " has joined the chatroom.");
		
		// get the list of all persons already in the chat room
		var peopleInChat = getPersonsInRoom(existingRoom);
	
		// update the number of online usernames and their names
		if(!(_.isEmpty(peopleInChat))) {
			io.sockets.in(existingRoom).emit("update-chatPeople", peopleInChat);
		}
		
		console.log(chatRooms);
	});  
       
    // when the client send a "chat message"   
	socket.on("chat message", function(msg, existingRoom){
      	console.log("Room: " + existingRoom);
      	// if the chat room is accessed from url (e.g. localhost:3030/family)
		if (existingRoom === null) {
			existingRoom = socket.room;
		}

      	// get the list of the persons joined the chat room
		var peopleInChat = getPersonsInRoom(existingRoom);

		console.log("Username: " + peopleInChat[socket.id] + " sent the message.");
		// this message is displayed to everyone 
		io.sockets.in(existingRoom).emit("chat message", peopleInChat[socket.id], msg);
	});
      
	// when a user leaves the chat room  
	socket.on("disconnect", function() {
		// if a chat room is left before a person entered it
		if (!(typeof getPersonsInRoom(socket.room) === 'undefined')) {
			// get the person left the chat room
			var personLeftRoom = getPersonsInRoom(socket.room)[socket.id];
			console.log("Username: " + personLeftRoom + " left the room.");

			// delete the person from the room if he/she left the room
			deletePersonFromRoom(socket.room, socket.id);
			
			// this is broadcasting to everyone else except for the socket that starts it 
			socket.broadcast.to(socket.room).emit("update", personLeftRoom + " has left the chatroom");
			
			// update the number and usernames who are online
			io.sockets.in(socket.room).emit("update-chatPeople",  getPersonsInRoom(socket.room));

			// the client leave the room, delete from the socket session
			socket.leave(socket.room);
		}
	});  
  });
	
  // Help function to find if the room exists.
  // returns true if it exist	
  function containsRoom (roomName) {
  	return _.contains(_.map(chatRooms, function(item) {
				return item['roomname'];
			}), roomName);
  }

  // loop through the list of rooms and add the new person into the matched room
  function addPersonToRoom (room_name, id, person_name) {
  	// we store the person name in the socket session as people of the current room
	// e.g. { socket.id: nameOfThePerson }
  	for (var i=0; i<chatRooms.length; i++) {
  		if (chatRooms[i]['roomname'] === room_name) {
  			chatRooms[i].people[id] = person_name;
  		}
  	}
  }

  // delete the person from the room if the person leave the room
  function deletePersonFromRoom (room_name, id) {
  	for (var i=0; i<chatRooms.length; i++) {
  		if (chatRooms[i]['roomname'] === room_name) {
  			delete chatRooms[i].people[id];
  		}
  	}
  }

  // get the list of all persons from the room 
  function getPersonsInRoom (room_name) {
  	for (var i=0; i<chatRooms.length; i++) {
  		if (chatRooms[i]['roomname'] === room_name) {
  			return chatRooms[i].people;
  		}
  	}
  }


  app.get('/', function(req, res) {
	res.render('index', { roomInPath: false });
  });
	

  app.get('/:roomName', function(req, res) {
	roomUrl = req.url.slice(1);
	if (containsRoom(roomUrl)) {
		res.render('index', {roomInPath: true });
	} else {
		res.send("This room doesn't exist. Please try this address " + "\"" + req.get('host') + "\"");
	}
  });
};