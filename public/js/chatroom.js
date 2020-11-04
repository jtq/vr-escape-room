(function connect() {

  const setUsername = name => {
    console.log(name);
    socket.emit('set_user', { username: name });
    curUsername.textContent = name;
  };

  // DOM elements
  let curUsername = document.querySelector('.card-header');

  let boxPosition = document.querySelector('#boxPosition');
  let box = document.querySelector('#box1');

  boxPosition.addEventListener('change', e => {
    console.log(boxPosition.value);
    socket.emit('update_state', { box1: { position:Number(boxPosition.value) } });
  });

  // Socket
  let socket = io.connect('http://localhost:3000');

  socket.on('connect', () => {
    console.log('connected:');
    setUsername(getRandomUsername());
  });

  socket.on('sync_state', newState => {
    console.log(`received new state: `, newState);
    boxPosition.value = newState.box1.position;
    box.style.left = newState.box1.position +'%';
  });

})();


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

function randomBetween(lowest, highest) {
  const range = highest - lowest;
  return Math.ceil(Math.random()*range)+lowest;
}