function toggleScreen(screenName) {
	$("#container").show();
	$(".screen").each(function(i) {
		$(this).hide();
	});
	$("#" + screenName).show();
}

$(document).ready(function() {
	toggleScreen("menu");

	$("#input-username").focus();
	$("#input-username").select();

    const socket = io();

    var canvas = document.getElementById("canvas-game");
    var ctx = canvas.getContext("2d");

    //ctx.translate(0.5, 0.5);

    var left = false;
	var right = false;
	var up = false;
	var down = false;

	window.addEventListener("keydown", onKeyDown, false);
	window.addEventListener("keyup", onKeyUp, false);

	function onKeyDown(event) {
		var keyCode = event.keyCode;
		switch (keyCode) {
	    	case 68: //d
	    		right = true;
	      		break;
	    	case 83: //s
	      		down = true;
	      		break;
	    	case 65: //a
	      		left = true;
	      		break;
	    	case 87: //w
	      		up = true;
	      		break;
	  	}

	  	var moveKeys = {
			left: left,
			right: right,
			up: up,
			down: down,
		}

		socket.emit("moveKeys", moveKeys);
	}

	function onKeyUp(event) {
		var keyCode = event.keyCode;
	  	switch (keyCode) {
	    	case 68: //d
	     	 	right = false;
	      		break;
	    	case 83: //s
	      		down = false;
	      		break;
	    	case 65: //a
	      		left = false;
	      		break;
	    	case 87: //w
	      		up = false;
	      		break;
	  	}

	  	var moveKeys = {
			left: left,
			right: right,
			up: up,
			down: down,
		}
		
		socket.emit("moveKeys", moveKeys);
	}

	$("#button-create").click(function(event) {
		var username = $("#input-username").val();
		var room = $("#input-room").val();
		socket.emit("createRoom", username, room);

		event.preventDefault();
	});	
	$("#button-join").click(function(event) {
		var username = $("#input-username").val();
		var room = $("#input-room").val();
		socket.emit("joinRoom", username, room);

		event.preventDefault();
	});	
	$("#button-leave").click(function(event) {
		socket.emit("leaveRoom");

		event.preventDefault();
	});
	$("#button-start").click(function(event) {
		socket.emit("startRoom");

		event.preventDefault();
	});

    //When there is an error on joining/creating/leaving
    socket.on("err", function(err) {
    	console.log(err);
    	$("#error").text(err);
    });

    //When there is success on joining/creating/leaving
    socket.on("success", function(type) {
    	$("#error").text("");
    	switch(type) {
		    case "createRoom":
		    	toggleScreen("room");
		        break;
		    case "joinRoom":
		        toggleScreen("room");
		        break;
		    case "leaveRoom":
		    	toggleScreen("menu");
		    	$("#menu-container h2").text("Capture The Flag")
		    	break;
		}
    });	

    //Called by the room when someone joins or leaves
    socket.on("connectedPlayers", function(players, adminID) {
    	$("#players").empty();
    	for (var i = 0; i < players.length; i++) {
   			var inner = players[i].username;
    		if (players[i].id == adminID) {
    			inner = "@ " + inner;
    		}
    		$("#players").append("<li class='playerItem'>" + inner + "</li>");
    	}
    	$("#players").append('<div class="clearfix"></div>')
    	$("#player-count").text("Players: " + players.length);
    });	

    //Set up the room according to whether they are an admin or not
    socket.on("setupRoom", function(localID, adminID, roomName) {
    	$("#menu-container h2").text(roomName);
       	if (localID == adminID) {
			$("#button-start").show();    	
    	} else {
    		$("#button-start").hide()
    	}
    });

    var ratio;
    var zoneWidth;
    var playerHeight;
    var playerWidth;
    var fontSize;

    socket.on("setupGame", function(gameData) {
    	toggleScreen("game");
    	$("#container").hide();

    	var ratioWidth = (window.innerWidth-8) / gameData.optimalWidth;
    	var ratioHeight = (window.innerHeight-8) / gameData.optimalHeight;

    	ratio = Math.min(ratioHeight,ratioWidth);

    	canvas.width = gameData.optimalWidth * ratio;
    	canvas.height = gameData.optimalHeight * ratio;
    	zoneWidth = gameData.zoneWidth * ratio;
    	playerHeight = gameData.playerHeight * ratio;
    	playerWidth = gameData.playerWidth * ratio;

    	fontSize = gameData.fontSize * ratio;
    });

    
/*
  _    _ _____  _____       _______ ______ 
 | |  | |  __ \|  __ \   /\|__   __|  ____|
 | |  | | |__) | |  | | /  \  | |  | |__   
 | |  | |  ___/| |  | |/ /\ \ | |  |  __|  
 | |__| | |    | |__| / ____ \| |  | |____ 
  \____/|_|    |_____/_/    \_\_|  |______|
                                           
*/


    socket.on("update", function(users, blueScore, redScore) {
    	//Background
    	ctx.fillStyle = "#000";
    	ctx.fillRect(0,0,canvas.width,canvas.height);

    	//Middle Line
		ctx.strokeStyle="#4cd137";
		ctx.setLineDash([30*ratio, 25*ratio]);
		ctx.lineWidth=5*ratio;
		ctx.beginPath();
		ctx.moveTo(canvas.width/2,0);
		ctx.lineTo(canvas.width/2,canvas.height);
		ctx.stroke();

		//Zones
		ctx.fillStyle="rgba(76,209,55,0.4)";
		ctx.setLineDash([]);
		ctx.lineWidth=5*ratio;

		//Blue zone
		ctx.beginPath();
		ctx.moveTo(zoneWidth,0);
		ctx.lineTo(zoneWidth,canvas.height);
		ctx.stroke();
		ctx.fillRect(0,0,zoneWidth,canvas.height);

		//Red zone
		ctx.beginPath();
		ctx.moveTo(canvas.width-zoneWidth,0);
		ctx.lineTo(canvas.width-zoneWidth,canvas.height);
		ctx.stroke();
		ctx.fillRect(canvas.width-zoneWidth,0,zoneWidth,canvas.height);

    	for (var i = 0; i < users.length; i++) {
    		var player = users[i];
 
    		if (player.alive == true) {
	    		if (player.team == "Red") {
	    			if (player.id == socket.id) {
	    				ctx.fillStyle = "#ff1c1c";
	    			} else {
	    				ctx.fillStyle = "#ff6666";
	    			}
	    		} else if (player.team == "Blue") {
	    			if (player.id == socket.id) {
	    				ctx.fillStyle = "#166df9";
	    			} else {
	    				ctx.fillStyle = "#66a0ff";
	    			}
	    		}
	    		ctx.fillRect(player.x * ratio, player.y * ratio, playerWidth, playerHeight);

	    		if (player.flag == true) {
	    			ctx.fillStyle = "#fff";
	    			ctx.fillRect((player.x*ratio)+playerHeight/4, (player.y*ratio)+playerWidth/4, playerHeight/2,playerWidth/2);
	    		}
	    	}
    	}

    	ctx.font = fontSize + "px sans-serif";
		ctx.fillStyle = "#4cd137";
		ctx.textAlign = "right"; 
		ctx.fillText(blueScore + "  ", canvas.width/2, 80 * ratio);
		ctx.textAlign = "left";
		ctx.fillText("  " + redScore, canvas.width/2, 80 * ratio);
    });    
});