
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

// Show object ina highlighted state
AFRAME.registerComponent('halo', {
  schema: {
    highlight: {type: 'color', default: '#00BF00'}
  },
  init: function () {
    this.el.object3D.traverse(obj => {
      if(obj.material && typeof obj.material.originalEmissive === 'undefined') {
        obj.material.originalEmissive = obj.material.emissive.getHex();
        obj.material.emissive.set(this.data.highlight);
        obj.material.originalEmissiveIntensity = obj.material.emissiveIntensity;
        obj.material.emissiveIntensity = 0.5;
      }
    });
  },
  remove: function () {
    this.el.object3D.traverse(obj => {
      if(obj.material && (typeof obj.material.originalEmissive !== 'undefined')) {
        obj.material.emissive.setHex(obj.material.originalEmissive);
        obj.material.emissiveIntensity = obj.material.originalEmissiveIntensity;
        delete(obj.material.originalEmissive);
        delete(obj.material.originalEmissiveIntensity);
      }
    });
  },
});

AFRAME.registerComponent('respond-interaction', {
  dependencies: ['animation'],
  schema: {
    interacted: {type: 'boolean', default: false},
    reversible: {type: 'boolean', default: true},
    translateVector: {type: 'vec3', default: {x: 0, y: 0, z: 1}},
    translateDuration: {type: 'int', default: 500},
  },
  init: function () {

    this.originalPosition = { ...this.el.components.position.attrValue };

    this.el.addEventListener('click', AFRAME.utils.bind(e => {

      if(!this.data.interacted) {
        const origPos = this.originalPosition;
        const curPos = this.el.getAttribute('position');
        const diffPos = this.data.translateVector;
        const destPos = {
          x: origPos.x+diffPos.x,
          y: origPos.y+diffPos.y,
          z: origPos.z+diffPos.z
        };
        //console.log(curPos, '->', destPos, this);
        this.el.setAttribute('animation', {
          property: 'position',
          from: curPos.x + ' ' + curPos.y + ' ' + curPos.z,
          to: destPos.x + ' ' + destPos.y + ' ' + destPos.z,
          dur: this.data.translateDuration,
          easing: 'linear',
          autoplay: true
        });
        this.data.interacted = true;
      }
      else if(this.data.reversible) { // Already interacted, but reversible
        const origPos = this.originalPosition;
        const curPos = this.el.getAttribute('position');
        //console.log(curPos, '->', origPos, this);
        this.el.setAttribute('animation', {
          property: 'position',
          from: curPos.x + ' ' + curPos.y + ' ' + curPos.z,
          to: origPos.x + ' ' + origPos.y + ' ' + origPos.z,
          dur: this.data.translateDuration,
          easing: 'linear',
          autoplay: true
        });
        this.data.interacted = false;
      }
    }));

    // this.el.addEventListener('click', function (evt) {
    // });
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





AFRAME.registerComponent('show-origin', {
  init: function () {
    this.el.object3D.traverse(obj => {
      if(obj instanceof THREE.Mesh && obj.material) {
        obj.userData.originalOpacity = obj.material.opacity;
        obj.material.opacity = 0.5;
        obj.userData.originalTransparent = obj.material.transparent;
        obj.material.transparent = true;
      }
    });
    // Add origin-marker
    const originMarker = document.createElement('a-sphere');
    originMarker.setAttribute('radius', '0.05');
    originMarker.setAttribute('position', '0 0 0');
    originMarker.setAttribute('material', 'color', '#ff0000');
    this.el.appendChild(originMarker);
  },
  remove: function () {
    this.el.object3D.traverse(obj => {
      if(obj.userData.originalOpacity || obj.userData.originalOpacity === 0) {
        obj.material.opacity = obj.userData.originalOpacity;
        delete(obj.userData.originalOpacity);
        obj.material.transparent = obj.userData.originalTransparent;
        delete(obj.userData.originalTransparent);
      }
    });
  },
});
