const express = require('express');
const socketio = require('socket.io');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log("server is running");
});

//initialize socket for the server
const io = socketio(server);

let state = {
  box1: {
    position: 50
  }
};

io.on('connection', socket => {
  socket.username = "Anonymous";
  console.log(`New user connected: ${socket.username}`);
  io.sockets.emit('sync_state', state);

  socket.on('set_user', data => {
    console.log(`set_user: ${socket.username} changed name to ${data.username}`);
    socket.username = data.username;
  });

  socket.on('update_state', newState => {
    console.log(`update_state: ${JSON.stringify(newState)}`);
    state = mergeState(newState);
    io.sockets.emit('sync_state', state);
  });
});

const mergeState = (newState) => ({...state, ...newState});