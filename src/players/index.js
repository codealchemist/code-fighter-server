console.log('Child process is initialized');


var player
var idPlayer

process.on('message', ({type, data}) => {
	switch(type){
		case 'initialize':
			initialize(data);
		break;
		case 'makeUpdate':
			if (player) {
				player.update(data.elapsedTime, data.userProperties, data.arenaStatus);
			} else {
				console.log('Player is not initialized yet');
			}
			process.send(data.userProperties);
		break;
	}
});
process.on('uncaughtException', function (err) {
    console.error("Error running player script: " + idPlayer)
});

function initialize({id}) {
	const Player = getById(id)
	player = new Player();
}



function getById(id) {
	idPlayer = id
	// TODO, get the code from a DB file
	switch(id) {
		case 1:
			return require('./PedrinGaul');
			break;
		case 2:
			return require('./PedrinGaul');
			break;
		case 3:
			return require('./DevilPlayer');
			break;
		default:
			console.error('Player id is missing', id)
			break;
	}
}