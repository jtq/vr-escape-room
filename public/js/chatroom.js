(function connect() {

  const user = {
    name: getRandomUsername(),
    colour: getRandomColour()
  };

  const registerUser = () => {
    console.log("Current user", user);
    document.querySelector('#userName').textContent = user.name;
    document.querySelector('#userColour').style.backgroundColor = user.colour;
    socket.emit('set_user', user);
  };

  // DOM elements

  let boxPosition = document.querySelector('#boxPosition');
  let box1 = document.querySelector('#box1');

  boxPosition.addEventListener('change', e => {
    console.log(boxPosition.value);
    socket.emit('update_state', {
      scene: {
        box1: {
          position: Number(boxPosition.value),
          lastTouched: user.name
        }
      }
    });
  });

  // Socket
  let socket = io.connect(':3000'); // Listen on same protocol+domain, port 3000

  socket.on('connect', () => {
    console.log('connected:');
    registerUser();
  });

  socket.on('sync_state', newState => {
    console.log(`received new state: `, newState);
    boxPosition.value = newState.scene.box1.position;
    box1.style.left = newState.scene.box1.position +'%';
    if(newState.scene.box1.lastTouched) {
      const lastToucher = newState.users[newState.scene.box1.lastTouched];

      if(lastToucher) { // Might not be the case if nobody's touched the state, or the last-toucher has since disconnected
        flashElement(box1, lastToucher.colour);
      }
    }
  });

})();




// DOM functions

function flashElement(el, colour) {
  el.style.transition = getComputedStyle(el)['transition'];
  el.style.transition = replaceTransition(el.style.transition, "box-shadow");
  el.style.boxShadow = colour + " 0px 0px 5px 3px";

  setTimeout(() => {
    el.style.transition = replaceTransition(el.style.transition, "box-shadow", "1s linear");
    el.style.boxShadow = "0px 0px 5px 3px transparent";
  }, 1000);
}

function replaceTransition(transitionString, findAttrib, replacementValue) {
  let hash = transitionStringToHash(transitionString);
  if(replacementValue) {
    hash[findAttrib] = findAttrib + " " + replacementValue;
  }
  else {
    delete(hash[findAttrib]);
  }

  return hashToTransitionString(hash);
}

function transitionStringToHash(transitionString) {
  return transitionString ? transitionString.split(/\s?,\s?/).reduce((acc, item) => {
    const attrib = item.split(/\s+/, 1);
    acc[attrib] = item;
    return acc;
  }, {}) : {};
}

function hashToTransitionString(transitionHash) {
  return transitionHash ? Object.keys(transitionHash).map(key => transitionHash[key]).join(', ') : "";
}


// Utility functions

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
  return "hsla(" + (randomBetween(0, 22) * 15) + "deg, 100%, 50%, 1)";
}

function randomBetween(lowest, highest) {
  const range = highest - lowest;
  return Math.ceil(Math.random()*range)+lowest;
}