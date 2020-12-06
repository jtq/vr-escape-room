const express = require('express');
const socketio = require('socket.io');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/sync-test', (req, res) => {
  res.render('index');
});
app.get('/objects', (req, res) => {
  res.render('objects');
});
app.get('/', (req, res) => {
  res.render('scene');
});

const port = process.env.PORT || 8001;
let server;

try {
  // Needed for HTTPS localdev
  var https = require('https');
  const fs = require('fs');

  var key = fs.readFileSync(__dirname + '/../certs/selfsigned.key');
  var cert = fs.readFileSync(__dirname + '/../certs/selfsigned.crt');
  var options = {
    key: key,
    cert: cert
  };
  // End HTTPS localdev
  server = https.createServer(options, app);
  server.listen(port, function() {
      console.log(`https server running on port ${port}`)
  });
}
catch(e) {
  console.log("HTTPS startup error", e);

  var http = require('http');

  server = http.createServer(app);
  server.listen(port, function() {
      console.log(`http server running on port ${port}`)
  });

}

//initialize socket for the server
const io = socketio(server);

let state = {
  users: {},
  scene: {
    ids: {
      // box1: {
      //   left: "100px"
      // }
    }
  }
};

io.on('connection', socket => {
  socket.user = {};
  console.log(`New user connected (anonymous)`);

  socket.on('set_user', data => {
    console.log(`set_user: ${socket.user.name} changed settings to ${JSON.stringify(data)}`);
    socket.user = data;
    state.users = mergeState({}, state.users, { [data.name]: data });
    io.sockets.emit('sync_state', state);
  });

  socket.on('update_state', newState => {
    console.log(`update_state: ${JSON.stringify(newState)}`);
    state = mergeState({}, state, newState);
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

const mergeState = (target, ...objs) => {
  objs.forEach(obj => Object.keys(obj).forEach(k => {
    if(typeof obj[k] === 'object') {
      if(typeof target[k] === 'undefined') {
        target[k] = {};
      }
      mergeState(target[k], obj[k]);
    }
    else {
      target[k] = typeof obj[k] !== 'undefined' ? obj[k] : target[k];
    }
  }));
  return target;
};