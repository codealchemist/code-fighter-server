const classes = require('./classes');
const PedrinGaul = require('./players/PedrinGaul');


const arena = new classes.Arena();

for (var i = 0; i < 3; i++) {
  arena.addPlayer(new PedrinGaul())
  // MarioBaracus is for play in team mode
  // app.arena.addPlayer(new MarioBaracus())
}



arena.start();
