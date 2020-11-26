
// Interactable component - responds to hover and click
AFRAME.registerComponent('interactable', {
  init: function () {
    // Set up initial state and variables.

    // Intersection
    this.onIntersection = AFRAME.utils.bind(e => {
      e.preventDefault();
      e.stopPropagation();
      this.el.setAttribute('halo', {});
    }, this);
    // Attach event listener.
    this.el.addEventListener('raycaster-intersected', this.onIntersection);

    // De-intersection
    this.onDeintersection = AFRAME.utils.bind(e => {
      e.preventDefault();
      e.stopPropagation();
      this.el.removeAttribute('halo');
    }, this);
    // Attach event listener.
    this.el.addEventListener('raycaster-intersected-cleared', this.onDeintersection);
  },
  update: function () {},
  tick: function () {},
  remove: function () {},
  pause: function () {},
  play: function () {}
});

AFRAME.registerComponent('interaction', {
  dependencies: ['animation'],
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
          this.el.removeAttribute('animation__interaction-'+componentName+'-backward');
          this.el.setAttribute('animation__interaction-'+componentName+'-forward', anim);
          this.data.interacted = true;
        }
      });
    });

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
          this.el.removeAttribute('animation__interaction-'+componentName+'-forward');
          this.el.setAttribute('animation__interaction-'+componentName+'-backward', anim);
          this.data.interacted = false;
        }
      });
    });

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

    this.el.addEventListener('click', AFRAME.utils.bind(e => {
      if(!this.data.interacted) {
        this.interact();
      }
      else if(this.data.reversible) { // Already interacted-with, but reversible
        this.uninteract();
      }
    }));
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
      alert('You found the Rubics Cube!');
      e.preventDefault();
      e.stopPropagation();
    });
  }
});