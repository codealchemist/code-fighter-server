console.log('child calling');


var player

process.on('message', ({type, data}) => {
	switch(type){
		case 'initialize':
			initialize(data);
		break;
		case 'makeUpdate':
			player.update(data.elapsedTime, data.userProperties, data.arenaStatus);
			process.send(data.userProperties);
		break;
	}
});

function initialize({id}) {
	// TODO, get the code from a DB file
	const Player = require('./PedrinGaul');
	player = new Player();
}