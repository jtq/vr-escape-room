const express = require('express');
const socketio = require('socket.io');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', {
    user: {
      name: getRandomUsername(),
      colour: getRandomColour()
    }
  });
});
app.get('/admin', (req, res) => {
  res.render('admin', { state });
});


app.get('/sync-test', (req, res) => {
  res.render('sync-test');
});
app.get('/objects', (req, res) => {
  res.render('objects');
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
    }
  }
};

const resetSceneMillisecondsAfterLastStateUpdate = 1000*60*10;
let lastUpdateTimer = null;
function clearState() {
  state.scene.ids = {};
  io.sockets.emit('sync_state', state);
}

// Generate pronouceable usernames from 3-6 chars with alternating consonantsand vowels.
function getRandomUsername() {
  const vowels = "aeiou";
  const consonants = "bcdfghjklmnpqrstvwxyz";
  const name = " ".repeat(randomBetween(3,6)).split("");
  return name.map((c, i) => {
    if(i % 2 === 1) {
      return consonants[randomBetween(0, consonants.length-1)];
    }
    else {
      return vowels[randomBetween(0, vowels.length-1)];
    }
  }).join("");
}

function getRandomColour() {
  return "#" +
    ("0"+((randomBetween(0, 16) * 16) - 1).toString(16)).substr(-2) +
    ("0"+((randomBetween(0, 16) * 16) - 1).toString(16)).substr(-2) +
    ("0"+((randomBetween(0, 16) * 16) - 1).toString(16)).substr(-2);
}

function randomBetween(lowest, highest) {
  const range = highest - lowest;
  return Math.ceil(Math.random()*range)+lowest;
}

io.on('connection', socket => {
  socket.user = {};
  console.log(`New user connected (anonymous)`);

  socket.on('set_user', data => {
    console.log(`set_user: ${socket.user.name} changed settings to ${JSON.stringify(data)}`);

    if(state.users[socket.user.name]) { // Remove any old user from state in case name has changed
      delete(state.users[socket.user.name]);
    }
    socket.user = data;
    state.users = mergeState({}, state.users, { [data.name]: data });
    io.sockets.emit('sync_state', state);
  });

  socket.on('update_state', newState => {
    if(lastUpdateTimer) {
      clearTimeout(lastUpdateTimer);
    }
    lastUpdateTimer = setTimeout(clearState, resetSceneMillisecondsAfterLastStateUpdate);
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

  //io.sockets.emit('sync_state', state); // Send initial world-state on connect
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