const express = require('express');
const socketio = require('socket.io');

// Needed for HTTPS localdev
var https = require('https');
const fs = require('fs');
const port = 8001;

var key = fs.readFileSync(__dirname + '/../certs/selfsigned.key');
var cert = fs.readFileSync(__dirname + '/../certs/selfsigned.crt');
var options = {
  key: key,
  cert: cert
};
// End HTTPS localdev

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});
app.get('/objects', (req, res) => {
  res.render('objects');
});
app.get('/scene', (req, res) => {
  res.render('scene');
});

var server = https.createServer(options, app);
server.listen(port, function() {
    console.log(`https server running on port ${port}`)
});

//initialize socket for the server
const io = socketio(server);

let state = {
  users: {},
  scene: {
    ids: {
      box1: {
        left: "100px"
      }
    }
  }
};

io.on('connection', socket => {
  socket.user = {};
  console.log(`New user connected (anonymous)`);

  socket.on('set_user', data => {
    console.log(`set_user: ${socket.user.name} changed settings to ${JSON.stringify(data)}`);
    socket.user = data;
    state.users = mergeState(state.users, { [data.name]: data });

    io.sockets.emit('sync_state', state);
  });

  socket.on('update_state', newState => {
    console.log(`update_state: ${JSON.stringify(newState)}`);
    state = mergeState(state, newState);
    io.sockets.emit('sync_state', state);
  });

  socket.on('disconnect', () => {
    console.log(`User : ${socket.user.name} disconnected`);
    if(socket.user.name) {
      delete(state.users[socket.user.name]);
      io.sockets.emit('sync_state', state);
    }
  });
});

const mergeState = (state, newState) => ({...state, ...newState});