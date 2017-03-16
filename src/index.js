var app = require('express')()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
const port = 3000
const clients = []

// temporal includes
const classes = require('./classes')
const PedrinGaul = require('./players/PedrinGaul')

const arena = new classes.Arena();

for (var i = 0; i < 3; i++) {
  arena.addPlayer(new PedrinGaul())
  // MarioBaracus is for play in team mode
  // app.arena.addPlayer(new MarioBaracus())
}

app.get('/', function(req, res) {
  res.send('hi world')
})
app.get('/start', function(req, res) {
  arena.start();
  res.send('Arena has started')
})
app.get('/stop', function(req, res) {
  arena.stop();
  res.send('Arena has stoped')
})
app.get('/addPlayer', function(req, res) {
  arena.addPlayer(new PedrinGaul())
  res.send('Player has added')
})




server.listen(port, function() {
    console.log('Server running at http://localhost:' + port)
});

io.on('connection', function(client) {
  clients.push(client)
  console.log('Added new connection')
});

const cachedFrames = []
sendStatus()
function sendStatus () {

  if (arena.elements.length > 0) {
    cachedFrames.push(JSON.parse(JSON.stringify(arena.elements)))
  }

  if(cachedFrames.length > 50) {
    for (var i = 0; i < clients.length; i++) {
      clients[i].emit('update_finish', JSON.stringify(cachedFrames));
    }
    cachedFrames.length = 0
  }

  setTimeout(sendStatus, 16);
}
