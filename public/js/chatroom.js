
  const user = {
    name: getRandomUsername(),
    colour: getRandomColour()
  };

  let state = {
    users: {},
    scene: {
      ids: {}
    }
  };

  const registerUser = () => {
    console.log("Current user", user);
    document.querySelector('#userName').textContent = user.name;
    document.querySelector('#userColour').style.backgroundColor = user.colour;
    socket.emit('set_user', user);
  };

  // DOM elements

  function makeDraggable(
    theEl,
    theContainer,
    mouseUpCallback=null,
    mouseDownCallback=null,
    mouseMoveCallback=null,
    constrainToContainer=true,
    enableXAxis=true,
    enableYAxis=true
  ) {
    const el = theEl;
    const container = theContainer;
    const constrain = constrainToContainer;
    let elementOffsetX = 0;
    let elementOffsetY = 0;

    let beingDragged = false;

    const mouseDownHandler = (e) => {
      if(e.target === el) {
        e.preventDefault();
        beingDragged = true;
        
        el.style.transition = replaceTransition(el.style.transition, "left");
        el.style.transition = replaceTransition(el.style.transition, "top");
        
        // Record the offset of the click into the object
        if(e.type === 'touchstart') {
          elementOffsetX = e.touches[0].pageX - el.offsetLeft;
          elementOffsetY = e.touches[0].pageY - el.offsetTop;
        }
        else {
          elementOffsetX = e.pageX - el.offsetLeft;
          elementOffsetY = e.pageY - el.offsetTop;
        }

        // Change box position to absolute pixel positions
        el.style.left = el.offsetLeft + 'px';
        el.style.top = el.offsetTop + 'px';

        // Change container dimensions to integer pixel values
        container.style.width = container.offsetWidth + 'px';
        container.style.height = container.offsetHeight + 'px';

        if(mouseDownCallback){
          mouseDownCallback(el.style.left, el.style.top, container.style.width, container.style.height, e);
        }
      }
    };
    const mouseMoveHandler = (e) => {
      if(beingDragged) {
        e.preventDefault();
        let newX, newY;

        if(e.type === 'touchstart') {
          newX = e.touches[0].pageX - elementOffsetX;
          newY = e.touches[0].pageY - elementOffsetY;
        }
        else {
          newX = e.pageX - elementOffsetX;
          newY = e.pageY - elementOffsetY;
        }

        if(constrain) {
          let maxX = container.offsetWidth-el.offsetWidth;
          let maxY = container.offsetHeight-el.offsetHeight;

          if(newX < 0 || newX > maxX || newY < 0 || newY > maxY) {
            mouseUpHandler(e);
          }
          newX = Math.min(Math.max(newX, 0), maxX);
          newY = Math.min(Math.max(newY, 0), maxY);
        }

        if(enableXAxis) {
          el.style.left = newX + 'px';
        }
        if(enableYAxis) {
          el.style.top = newY + 'px';
        }
        if(mouseMoveCallback) {
          mouseMoveCallback(el.style.left, el.style.top, container.style.width, container.style.height, e);
        }
      }
    };
    const mouseUpHandler = (e) => {
      if(beingDragged) {
        e.preventDefault();
        beingDragged = false;

        if(mouseUpCallback) {
          mouseUpCallback(el.style.left, el.style.top, container.style.width, container.style.height, e);
        }

        el.style.transition = replaceTransition(el.style.transition, 'left', '1s ease');
        el.style.transition = replaceTransition(el.style.transition, 'top', '1s ease');
      }
    };
    
    container.addEventListener('mousedown', mouseDownHandler);
    container.addEventListener('mousemove', mouseMoveHandler);
    container.addEventListener('mouseup', mouseUpHandler);

    container.addEventListener("touchstart", mouseDownHandler, false);
    container.addEventListener("touchmove", mouseMoveHandler, false);
    container.addEventListener("touchend", mouseUpHandler, false);

    return () => {  // Remove draggable status from element
      container.removeEventListener('mousedown', mouseDownHandler);
      container.removeEventListener('mousemove', mouseMoveHandler);
      container.removeEventListener('mouseup', mouseUpHandler);

      container.removeEventListener("touchstart", mouseDownHandler);
      container.removeEventListener("touchmove", mouseMoveHandler);
      container.removeEventListener("touchend", mouseUpHandler);
    };
  }

  makeDraggable(
    document.querySelector('#box1'),
    document.querySelector('#container'),
    (boxLeft, boxTop, containerWidth, containerHeight, e) => {
      console.log(`mouseup`, boxLeft, boxTop, containerWidth, containerHeight, e);
      socket.emit('update_state', {
        scene: {
          ids: {
            box1: {
              left: boxLeft,
              top: boxTop,
              lastTouched: user.name
            }
          }
        }
      });
    }
  );

  let boxPosition = document.querySelector('#boxPosition');

  boxPosition.addEventListener('change', e => {
    console.log(boxPosition.value);
    socket.emit('update_state', {
      scene: {
        ids: {
          box1: {
            left: boxPosition.value + '%',
            lastTouched: user.name
          }
        }
      }
    });
  });

  // Socket
  let socket = io.connect(); // Listen on same protocol+domain+port

  socket.on('connect', () => {
    console.log('connected:');
    registerUser();
  });

  socket.on('sync_state', newState => {
    console.log(`received new state: `, newState);
    Object.entries(newState.scene.ids).forEach(([id, newProps]) => {
      let el = document.querySelector("#"+id);
      let oldProps = state.scene.ids[id] || {};

      let changed = false;
      Object.entries(newProps).forEach(([prop, value]) => {
        if(oldProps[prop] !== value) {
          el.style[prop] = value;
          changed = true;
        }
        if(changed && newProps.lastTouched) {
          const lastToucher = newState.users[newProps.lastTouched];
          if(lastToucher) { // Might not be the case if nobody's touched the state, or the last-toucher has since disconnected
            flashElement(el, lastToucher.colour);
          }
        }
      });

    });

    document.querySelector("#boxPosition").value = newState.scene.ids.box1.left.match(/\d+/)[0];
  });






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