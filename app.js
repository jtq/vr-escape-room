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
  users: {},
  scene: {
    box1: {
      position: 50
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