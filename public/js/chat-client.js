'use strict'

$(function() {
	// set the socket on the client side
	var socket = io();
	var usernameInput;

	// initialize variables
	var $inputMessage = $('#inputMessage'); // Message in the input "inputMessage" box
	var $usernameInput = $('#usernameInput'); // Input for username
	var $chatbox = $('#chatbox'); // box where all messages are listed
	var $join_input = $('#join-input'); // Input usernameInput with Join button wrapped by p tag
	
	$chatbox.hide();

	$($usernameInput).keypress(function(event) {
		if(event.which == 13) {
			$('#join').click();
		}
	});

	// this executes when the "join" button in click
	$('#join').click(function() {
		var name = $usernameInput.val();
		if(name != '') {
			// assign the username to usernameInput for layout display
	    	usernameInput = name;
	    	// 
			socket.emit('join', name);
			$chatbox.show();
			$inputMessage.focus();
			$join_input.hide(2000);
			console.log("Username: " + usernameInput);
			$($inputMessage).attr({"placeholder" : usernameInput + " your message here..."});
		}
	});

	// when the enter key is pressed the code executes
	$($inputMessage).keypress(function(event) {
		if(event.keyCode == 13) {
			socket.emit('chat message', $inputMessage.val());
	   		$inputMessage.val('');
	   		$($inputMessage).attr({"placeholder" : usernameInput + " your message here..."});
		}
	});
	
	// update the chat box when a new user join or left chat room
	socket.on('update', function(msg) {
		$('#messages').append($('<p>').text(msg));
		$($inputMessage).attr({"placeholder" : usernameInput + " your message here..."});	
	}); 

	// update the chat with e new message
	socket.on('chat message', function(username, msg){
	    $('#messages').append($('<p>').text(username + "  " + msg));
	});	

	// update the chat room with the number and names people who are online 
	socket.on('update-chatPeople', function(chatPeople) {
		console.log(chatPeople);
		var numberOfPeople = 0;
		$('#sidebar').empty();
		$.each(chatPeople, function(key, value) {
			$('#sidebar').append($('<p>').text(chatPeople[key]));
			++numberOfPeople;
		});

		$('#sidebar').append($('<p>').text(numberOfPeople + " online"));
	});

	// execute when the page is reloaded
	$(window).unload(function() {
		socket.emit('disconnect');
	});

});  

      
