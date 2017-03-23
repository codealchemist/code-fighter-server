var app = require('express')()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
const port = 3001
const clients = []
const classes = require('./classes')


const arena = new classes.Arena();

for (var i = 0; i < 3; i++) {
  arena.addPlayer(new classes.Player(i + 1))
  // MarioBaracus is for play in team mode
  // app.arena.addPlayer(new MarioBaracus())
}
arena.start();

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
  arena.addPlayer(new classes.Player())
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
const framesInterlive = 1000
let lastFrameSend = new Date();
sendStatus()
function sendStatus () {

  if (arena.elements.length > 0) {
    cachedFrames.push(JSON.parse(JSON.stringify(arena.elements)))
  }

  if(new Date() - lastFrameSend > framesInterlive) {
    console.log('Sending ' + cachedFrames.length + ' frames');
    for (var i = 0; i < clients.length; i++) {
      clients[i].emit('update_finish', JSON.stringify(cachedFrames));
    }
    cachedFrames.length = 0
    lastFrameSend = new Date();
  }

  setTimeout(sendStatus, 16);
}
