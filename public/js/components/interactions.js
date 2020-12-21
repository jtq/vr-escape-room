const INTERACTION_EVENT = "interact";
const INTERACTION_COMPONENT = "interaction";

// Interactor component - attach to cursor for an occlusion-respecting cursor
AFRAME.registerComponent('interactor', {
  init: function () {
    // Set up initial state and variables.
    this.oldIntersectedEls = [];
    this.selectedEl = null;
    this.lastClicked = null;

    this.getNearestIntersectingElement = (selectIf, selectFirst) => {
      const oldEls = this.oldIntersectedEls.map(e=>e.id).toString();
      const newEls = this.el.components['raycaster'].intersectedEls.map(e=>e.id).toString();
      if(oldEls === newEls) {
        return;
      }

      const uniqueObjsSet = new WeakSet();
      const uniqueObjsByDistance = [];

      this.oldIntersectedEls.forEach(el => el.removeAttribute('highlight'));
      this.selectedEl = null;

      this.oldIntersectedEls = [ ...this.el.components['raycaster'].intersectedEls];

      this.el.components['raycaster'].intersectedEls.forEach(el => {
        if(!uniqueObjsSet.has(el)) {
          uniqueObjsSet.add(el);
          uniqueObjsByDistance.push(el);
        }
      });

      if(uniqueObjsByDistance.length) {
        if(
          (!selectIf && !selectFirst) ||
          (selectIf && uniqueObjsByDistance[0].matches(selectIf))
        ) {
          this.selectedEl = uniqueObjsByDistance[0];
        }
        else if(selectFirst) {
          this.selectedEl = uniqueObjsByDistance.find(el => el.matches(selectFirst));
        }

        if(this.selectedEl) {
          this.selectedEl.setAttribute('highlight', {});
        }
      }
    };

    this.el.addEventListener('click', (e) => {
      if(this.selectedEl) {
        this.selectedEl.emit(INTERACTION_EVENT, e);
        this.lastClicked = this.selectedEl;
      }
      e.preventDefault();
      e.stopPropagation();
    });
  },
  update: function () {},
  tick: function (sinceLoad, sinceLastFrame) {
    this.getNearestIntersectingElement('['+INTERACTION_COMPONENT+']');
  },
  remove: function () {},
  pause: function () {},
  play: function () {}
});

AFRAME.registerSystem(INTERACTION_COMPONENT, {
  init: function() {
    this.user = {
      name: getRandomUsername(),
      colour: getRandomColour()
    };

    this.state = {
      users: {},
      scene: {
        ids: {}
      }
    };

    this.registerUser = () => {
      this.socket.emit('set_user', this.user);
    };

    // Socket
    this.socket = io.connect(); // Listen on same protocol+domain+port

    this.socket.on('connect', () => {
      //this.registerUser();  // Now triggeed by user-name input in init dialogue
    });

    this.socket.on('sync_state', serverState => this.getServerUpdate(serverState));

    this.syncToServer = (id, value) => {
      if(!id) {
        console.error('Interactable objects must have an id.  Provided args:', { id, value});
      }
      else {
        this.socket.emit('update_state', {
          scene: {
            ids: {
              [id]: {
                ...value,
                lastTouched: this.user.name
              }
            }
          }
        });
      }
    };

    this.getServerUpdate = (serverState) => {
      Object.entries(serverState.scene.ids).forEach(([id, serverProps]) => {
        let el = document.querySelector("#"+id);
        this.state.scene.ids[id] = this.state.scene.ids[id] || {};
        let ourProps = this.state.scene.ids[id] || {};

        let changed = false;
        Object.entries(serverProps).forEach(([prop, serverValue]) => {
          if(ourProps[prop] !== serverValue) {
            ourProps[prop] = serverValue;
            if(prop !== 'lastTouched') {
              el.setAttribute('interaction', prop, serverValue);
            }
            changed = true;
          }
        });
        if(changed && serverProps.lastTouched) {
          const lastToucher = serverState.users[serverProps.lastTouched];
          if(lastToucher) { // Might not be the case if nobody's touched the state, or the last-toucher has since disconnected
            el.setAttribute('halo', {   // start a new animation to flash the object in the owner's colour
              color: lastToucher.colour,
              duration: 2500,
              opacity: 0.75,
              forceUpdate: Math.random()  // force an update to halt and restart any animations in progress (specifically, in case we were also the last one to interact with the object so setting the ownerColor alone won't restart the animation)
            });
          }
        }
      });
    };

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
      return "#" +
        ("0"+((randomBetween(0, 16) * 16) - 1).toString(16)).substr(-2) +
        ("0"+((randomBetween(0, 16) * 16) - 1).toString(16)).substr(-2) +
        ("0"+((randomBetween(0, 16) * 16) - 1).toString(16)).substr(-2);
    }

    function randomBetween(lowest, highest) {
      const range = highest - lowest;
      return Math.ceil(Math.random()*range)+lowest;
    }

  },

});

AFRAME.registerComponent(INTERACTION_COMPONENT, {
  dependencies: ['animation'],
  events: {
    [INTERACTION_EVENT]: function (e) {  // Don't use fat-arrows, as this is evaluated in the global context and fat-arrow auto-binding will break it
      if(!this.data.interacted) {
        this.interact();
      }
      else if(this.data.reversible) { // Already interacted-with, but reversible
        this.uninteract();
      }
      const uploadVals = { interacted:this.data.interacted };
      this.system.syncToServer(this.el.id, uploadVals);
    }
  },
  schema: {
    interacted: {type: 'boolean', default: false},
    reversible: {type: 'boolean', default: true},
    easing: {type:'string', default:'linear'},
    positionOffset: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
    positionDuration: {type: 'int', default: 500},
    rotationOffset: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
    rotationDuration: {type: 'int', default: 500},
  },
  init: function () {

    if(!this.el.id) {
      console.error('Interactable objects must have an id', this);
    }

    this.interact = AFRAME.utils.bind(() => {
      ['position', 'rotation'].forEach(componentName => {
        if(this.attrValue[componentName+'Offset']) {
          const origPos = this.originalValues[componentName];
          const diffPos = this.data[componentName+'Offset'];
          const destPos = {
            x: origPos.x+diffPos.x,
            y: origPos.y+diffPos.y,
            z: origPos.z+diffPos.z
          };
          const anim = {
            property: componentName,
            to: destPos.x + ' ' + destPos.y + ' ' + destPos.z,
            dur: this.data[componentName+'Duration'],
            easing: this.data.easing,
            autoplay: true
          };
          this.el.removeAttribute('animation__'+INTERACTION_COMPONENT+'-'+componentName+'-backward');
          this.el.setAttribute('animation__'+INTERACTION_COMPONENT+'-'+componentName+'-forward', anim);
          this.data.interacted = true;
        }
      });
    }, this);

    this.uninteract = AFRAME.utils.bind(() => {
      ['position', 'rotation'].forEach(componentName => {
        if(this.attrValue[componentName+'Offset']) {
          const origPos = this.originalValues[componentName];
          const anim = {
            property: componentName,
            to: origPos.x + ' ' + origPos.y + ' ' + origPos.z,
            dur: this.data[componentName+'Duration'],
            easing: this.data.easing,
            autoplay: true
          };
          this.el.removeAttribute('animation__'+INTERACTION_COMPONENT+'-'+componentName+'-forward');
          this.el.setAttribute('animation__'+INTERACTION_COMPONENT+'-'+componentName+'-backward', anim);
          this.data.interacted = false;
        }
      });
    }, this);

    ['position', 'rotation'].forEach(componentName => {
      // If component to animate doesn't exist, add it.
       if(!this.el.getAttribute(componentName)) {
        this.el.setAttribute(componentName, {});
      }
      // If we don't already have an origin to animate from, add it
      this.originalValues = this.originalValues || {};
      if(!this.originalValues[componentName]) {
        this.originalValues[componentName] = { ...this.el.getAttribute(componentName) }; // Ensure it's a proper vector and not just a POJO
      }
    });
  },
  update: function(oldData) {
    if(oldData.interacted !== this.data.interacted) {
      if(this.data.interacted) {
        this.interact();
      }
      else {
        this.uninteract();
      }
    }
  }
});

AFRAME.registerComponent('selectable-goal', {
  init: function () {
    this.el.addEventListener('click', function (e) {
      alert('You found the Rubiks Cube!');
      e.preventDefault();
      e.stopPropagation();
    });
  }
});
