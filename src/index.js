var app = require('express')()
var bodyParser = require("body-parser");
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var Guid = require('guid')
const port = 3001
const clients = []
const classes = require('./classes')

////////////////////////////////////
/////// Configuration //////////////
////////////////////////////////////
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.urlencoded({
  extended: true
}));


////////////////////////////////////
///////// Game Start ///////////////
////////////////////////////////////

const arena = new classes.Arena();
const players = {};

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

app.post('/player',bodyParser.json(), function(req, res) {
  if (players[req.body.username]) {
    console.log('Player update')
    players[req.body.username] = req.body.code
    arena.updatePlayer(req.body.username, req.body.code)
  } else {
    console.log('Player new')
    players[req.body.username] = req.body.code
    // Temporal, id === username
    arena.addPlayer(req.body.username, req.body.username, req.body.color, req.body.guid, new classes.Player(req.body.username, req.body.code))
  }
  res.send('ok');
})

server.listen(port, function() {
    console.log('Server running at http://localhost:' + port)
});

io.on('connection', function(client) {
  clients.push(client)
  const clientId = Guid.raw();
  client.id = clientId;
  client.emit('handshake', clientId);
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

  // check for errors
  for (var i = 0; i < arena.elements.length; i++) {
    if (arena.elements[i].type === 'ship' && arena.elements[i].error) {
      for (var j = 0; j < clients.length; j++) {
        if (clients[j].guid === arena.elements[i].guid) {
          console.log('SENDING ERROR TO ' + arena.elements[i].ship.name);
          clients[j].emit('player_error', JSON.stringify(arena.elements[i].error));
          break;
        }
      }
    }
  }

  setTimeout(sendStatus, 16);
}
