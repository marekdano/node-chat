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
		
		// if the room is already existed
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
			console.log("New room has added to chatRooms " + roomName);

			roomUrl = roomName;
		}
		
		// get host name using: socket.handshake.headers.host (e.g. localhost:3030)
		socket.emit('create', socket.handshake.headers.host + '/' + roomName, alredyExistsMessage);

		console.log(chatRooms);
	
	});  
	  
	// when the client emits 'login', this listens and executes
	// save username and avatar, and add them to the room 
	socket.on("join", function(name, existedRoom) {
		// we store the username in the socket session for this username
		// we picked this approach intead of "socket.id"
		// { socket.id: name_of_the_person }
		console.log('Room name: ' + existedRoom);
		console.log('Room url: ' + roomUrl);
		
		// if the chat room is accessed from url (e.g. localhost:3030/family)
		if (existedRoom === null) {
			existedRoom = roomUrl;
		}

		console.log("New person JOIN the room.");
		console.log("Room name: " + existedRoom);

		// store the room name in the socket session for this client 
		socket.room = existedRoom;

		// send client to the existed room
		socket.join(existedRoom);
		
		// add the new person to the room
		addPersonToRoom(existedRoom, socket.id, name);	
		
		// this will be emitted just to the socket that join the chat 
		socket.emit("update", "You have connected to the chatroom.");
		// broadcasting means sending a message to everyone else except for 
		// the socket that starts it
		socket.broadcast.to(existedRoom).emit("update", name + " has joined the chatroom.");

		console.log("Existed room: " + existedRoom);
		
		// get the list of the persons joined the chat room
		var peopleInChat = getPersonsInRoom(existedRoom);
		console.log(peopleInChat);
		// update the number of online usernames and their names
		if(!(_.isEmpty(peopleInChat))) {
			io.sockets.in(existedRoom).emit("update-chatPeople", peopleInChat);
		}
		
		console.log(chatRooms);
	});  
       
    // when the client send a "chat message"   
	socket.on("chat message", function(msg, existedRoom){
      	console.log("Room: " + existedRoom);
      	// if the chat room is accessed from url (e.g. localhost:3030/family)
		if (existedRoom === null) {
			existedRoom = socket.room;
		}

      	// get the list of the persons joined the chat room
		var peopleInChat = getPersonsInRoom(existedRoom);
		console.log(peopleInChat);

		console.log("Username: " + peopleInChat[socket.id]);
		// this message is displayed to everyone 
		io.sockets.in(existedRoom).emit("chat message", peopleInChat[socket.id], msg);
	});
      
	// when a user leaves the chat room  
	socket.on("disconnect", function() {
		console.log("Room: " + socket.room);
		console.log("Socket ID: " + socket.id);
		
		console.log("Persons: " + chatRooms);

		// get the list of the persons joined the chat room
		var personLeftRoom = getPersonsInRoom(socket.room)[socket.id];

		//console.log("Person left room: " + personLeftRoom);

		deletePersonFromRoom(socket.room, socket.id);
		//console.log(peopleInChat);

		//console.log("Client name: " + peopleInChat[socket.id]);
		// this is broadcasting to everyone else except for the socket that starts it 
		socket.broadcast.to(socket.room).emit("update", personLeftRoom + " has left the chatroom");
		
		//console.log("Person ID" + peopleInChat[socket.id]);

		// update the number and usernames who are online
		io.sockets.in(socket.room).emit("update-chatPeople",  getPersonsInRoom(socket.room));

		// the client leave the room
		socket.leave(socket.room);
	});  
  });
	
  // Help function to find if the room exists.
  // returns true if it exist	
  function containsRoom (roomName) {
  	return _.contains(_.map(chatRooms, function(item) {
  				var roomname = item.roomname;
  				console.log("room name: " + roomname);
				return roomname;
			}), roomName);
  }

  // loop through the list of rooms and add the new person into the matched room
  function addPersonToRoom (room_name, id, person_name) {
  	console.log(id);
  	for (var i=0; i<chatRooms.length; i++) {
  		if (chatRooms[i].roomname === room_name) {
  			chatRooms[i].people[id] = person_name;
  		}
  	}
  }

  function deletePersonFromRoom (room_name, id) {
  	for (var i=0; i<chatRooms.length; i++) {
  		if (chatRooms[i].roomname === room_name) {
  			delete chatRooms[i].people[id];
  		}
  	}
  }

  function getPersonsInRoom (room_name) {
  	for (var i=0; i<chatRooms.length; i++) {
  		if (chatRooms[i].roomname === room_name) {
  			return chatRooms[i].people;
  		}
  	}
  }

  // if the chat room is accessed from url (e.g. localhost:3030/family)
  function setRoom (existedRoom) {
	
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
	roomUrl = req.url.slice(1);
	if (containsRoom(roomUrl)) {
		res.render('index');
	} else {
		res.send("This room doesn't exist. Please try this address " + "\"" +req.get('host') + "\"");
	}
  });
};