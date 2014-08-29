'use strict'

$(function() {
	// set the socket on the client side
	var socket = io();
	
	var usernameInput;
	var createdRoom = null;

	// initialize variables
	var $inputMessage = $('#inputMessage'); // Message in the input "inputMessage" box
	var $chatRoomInput = $('#room'); // Input for chat room
	var $usernameInput = $('#usernameInput'); // Input for username
	var $createbox = $('#createbox'); // box for entering new room
	var $joinbox = $('#joinbox'); // box for entering room URL address with entering input field
	var $chatbox = $('#chatbox'); // box where all messages are listed
	var $joinInput = $('#join-input'); // Input usernameInput with Join button wrapped by p tag
	
	var $createChat = $('#create'); // button CREATE for creating a room
	var $joinChat = $('#join'); // button JOIN for joining a chat room 
	var $sideBar = $('#sidebar'); // place for listing the online user's names
	
	
	console.log("Path: " + $(location).attr('pathname'));
	if($(location).attr('pathname') === "/") {
		$joinbox.hide();
	} else {
		$createbox.hide();
		$joinbox.show();
	}
	
	// hide the conversation of the chat room before singing into a chat room
	$chatbox.hide();
	
	// create a chat room when ENTER key is hit
	$($chatRoomInput).keypress(function () {
		if(event.which == 13) {
			$($createChat).click();
		}
	});
	
	// join a chat room when ENTER key is hit
	$($usernameInput).keypress(function(event) {
		if(event.which == 13) {
			$($joinChat).click();
		}
	});

	// this executes when the "create" button is clicked
	$($createChat).click(function () {
		var roomName = $chatRoomInput.val();
		// send request to the server
		console.log("Room name: " + roomName);
		createdRoom = roomName;
		
		socket.emit('createRoom', roomName);
		/*
		$.ajax({ 
           url: "/create",
           type: 'POST',
    	   cache: false,
		   async: false,
           data: { roomName: roomName }, 
           success: function(data){
              console.log('Success!')
           }
           , error: function(jqXHR, textStatus, err){
               console.log('text status '+textStatus+', err '+err)
           }	
        }); 
		*/
	});

	// this executes when the "join" button in click
	$($joinChat).click(function() {
		var name = $usernameInput.val();
		if(name != '') {
			// assign the username to usernameInput for layout display
	    	usernameInput = name;
	    	// send 'join' event
			socket.emit('join', name, createdRoom);
			$chatbox.show();
			$inputMessage.focus();
			$joinInput.hide(2000);
			console.log("Username: " + usernameInput);
			$($inputMessage).attr({"placeholder" : usernameInput + " your message here..."});
		}
	});
	

	// when the ENTER key is pressed the code executes
	$($inputMessage).keypress(function(event) {
		if(event.keyCode == 13) {
			socket.emit('chat message', $inputMessage.val(), createdRoom);
	   		$inputMessage.val('');
	   		$($inputMessage).attr({"placeholder" : usernameInput + " your message here..."});
		}
	});
	
	// listen for url of the new chat
	socket.on('create', function(url, message) {
		$createbox.hide('blind', 500);
		$joinbox.show('clip', 2000);
		console.log("URL: " + url);
		if(message) {
			$('#joinbox #join-input').before($('<p>').text(message));
		}
		
		$('#joinbox #join-input').before($('<h5 id="chatUrl">').text(url)).before($('<p>')
								.text("Please invite somebody to chat with you using this address."));	
	});
	
	// update the chat box when a new user join or left chat room
	socket.on('update', function(msg) {
		$('#messages').append($('<h4 class="message-box">').text(msg));
		$($inputMessage).attr({"placeholder" : usernameInput + " your message here..."});	
	}); 

	// update the chat with a new message
	socket.on('chat message', function(username, msg){
		$('#messages').append('<div class="row message-box"><div class="col-md-3">' + 
							username + '</div><div class="col-md-9"><p class="bubble">' + msg +'</p></div></div>');
	});	

	// update the chat room with the number and names people who are online 
	socket.on('update-chatPeople', function(chatPeople) {
		console.log("Chat people in this room: " + chatPeople);
		// initialise the variables every time when the function is called 
		var numberOfPeople = 0;
		$($sideBar).empty();

		var items = [];
		$.each(chatPeople, function(key, value) {

			if (numberOfPeople < 6) {
				items.push('<a class="list-group-item">' + chatPeople[key] + '</a>');
				//$($sideBar).append($('<p>').text(chatPeople[key]));
			}	
			++numberOfPeople;
		});

		console.log(items);
		$($sideBar).append( items.join('') );

		$($sideBar).append($('<div class="well well-sm"><span>' + numberOfPeople + '</span> online </div>'));
	});
});  

      
