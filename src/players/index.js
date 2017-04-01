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
			if (player) {
				userPropertiesBackUp = data.userProperties;
				player.update(data.elapsedTime, data.userProperties, data.arenaStatus);
			} else {
				console.log('Player is not initialized yet');
			}
			process.send({
				type:'makeUpdate',
				data: data.userProperties
			});
		break;
	}
});
process.on('uncaughtException', function (err) {
    console.error("Error running player script: " + idPlayer)
    process.send({
		type:'errorOnUpdate',
		data: userPropertiesBackUp,
		error: err.message
	});
});

function initialize({id, code}) {
	idPlayer = id

	let playerClass = eval(code)
	player = new playerClass()
}
