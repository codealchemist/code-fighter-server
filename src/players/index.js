console.log('Child process is initialized');


var player
var idPlayer
var userPropertiesBackUp;

process.on('message', ({type, data}) => {

	switch(type){
		case 'initialize':
			initialize(data);
		break;
		case 'makeUpdate':
			makeUpdate(data)
		break;
	}
});
process.on('uncaughtException', function (err) {
    //console.error("Error running player script: " + idPlayer)
    process.send({
		type:'makeUpdateResp',
		data: userPropertiesBackUp,
		error: err.message
	});
});

function initialize({id, code}) {
	idPlayer = id
	console.log('initializing player' , idPlayer);

	let playerClass = eval(code)
	player = new playerClass()

	process.send({
		type:'initializeResp',
		data: 'ok',
		error: undefined
	});
}

function makeUpdate(data) {
	if (player) {
		userPropertiesBackUp = data.userProperties;
		player.update(data.elapsedTime, data.userProperties, data.arenaStatus);

		process.send({
			type:'makeUpdateResp',
			data: data.userProperties
		});
	} else {
		process.send({
			type:'makeUpdateResp',
			data: data.userProperties,
			error: 'Player is not initialized yet'
		});
	}
}
