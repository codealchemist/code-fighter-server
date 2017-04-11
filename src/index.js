const Logger = require('./modules/logger')
const Config = require('./modules/config')
const app = require('express')()
const bodyParser = require("body-parser")
const server = require('http').createServer(app)
const host = 'localhost';
const io = require('socket.io')(server)
const Guid = require('guid')
const port = 3001
const clients = []
const classes = require('./classes')
require('now-logs')('code-fighter-server-super-awesome-logs')




////////////////////////////////////
/////// Configuration //////////////
////////////////////////////////////
Logger.silly('Configuration Start')

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.urlencoded({
  extended: true
}));

Logger.silly('Configuration End')
////////////////////////////////////
///////// Game Start ///////////////
////////////////////////////////////

const arena = new classes.Arena();
const players = {};

arena.start();

////////////////////////////////////
///// Routes Configuration /////////
////////////////////////////////////

app.get('/', function(req, res) {
  Logger.verbose('get -> /')

  res.send('Hello world')
})
app.get('/start', function(req, res) {
  Logger.verbose('get -> /start')

  arena.start();

  Logger.info('Arena has started')
  res.send('Arena has started')
})
app.get('/stop', function(req, res) {
  Logger.verbose('get -> /stop')

  arena.stop();

  Logger.info('Arena has stoped')
  res.send('Arena has stoped')
})

app.post('/player',bodyParser.json(), function(req, res) {
  Logger.verbose('post -> /player')

  if (players[req.body.guid]) {
    Logger.verbose('Player update')

    players[req.body.guid] = req.body.code
    arena.updatePlayer(req.body.username, req.body.code)
  } else {
    Logger.verbose('Player new')

    players[req.body.guid] = req.body.code

    arena.addPlayer(req.body.guid, req.body.username, req.body.color, req.body.guid, new classes.Player(req.body.username, req.body.code))
  }

  res.send('ok');
})

server.listen(port, function() {
    Logger.info('Server running at http://' + host + ':' + port)
});

////////////////////////////////////
//// Sockets Configuration /////////
////////////////////////////////////
io.on('connection', function(client) {
  Logger.verbose('io -> connection')

  const clientId = Guid.raw()
  clients.push(client)
  client.id = clientId
  client.emit('handshake', clientId)
  Logger.info('Added new connection')
});

const cachedFrames = []
const framesInterlive = 1000
let lastFrameSend = new Date();
sendStatus()
function sendStatus () {


  cachedFrames.push(JSON.parse(JSON.stringify(arena.elements)))


  if(new Date() - lastFrameSend > framesInterlive) {
    Logger.log(cachedFrames.length > 60 ? 'silly' : 'warn','Sending ' + cachedFrames.length + ' frames')
    for (var i = 0; i < clients.length; i++) {
      clients[i].emit('update_finish', JSON.stringify(cachedFrames));
    }
    cachedFrames.length = 0
    lastFrameSend = new Date();
  }

  // check for errors
  for (var i = 0; i < arena.elements.length; i++) {
    if (arena.elements[i].type === 'ship') {
      if (arena.elements[i].error) {
        let clie = clients.find((client) => {
          return client.guid === arena.elements[i].guid
        })
        if (clie) {
          Logger.debug('Sending error to ' + arena.elements[i].ship.name, arena.elements[i].error)
          clie.emit('player_error', JSON.stringify(arena.elements[i].error));
        } else {
          // the guid wasn't found
        }
      }
      if (arena.elements[i].messages) {
        let clie = clients.find((client) => {
          return client.guid === arena.elements[i].guid
        })
        if (clie) {
          Logger.debug('Sending message to ' + arena.elements[i].ship.name, arena.elements[i].messages)
          clie.emit('player_message', JSON.stringify(arena.elements[i].messages));
        } else {
          // the guid wasn't found
        }
      }
    }
  }

  setTimeout(sendStatus, 16);
}
