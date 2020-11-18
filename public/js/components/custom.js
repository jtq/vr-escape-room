
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
      if(obj instanceof THREE.Mesh && obj.material) {
        obj.userData.originalEmissive = obj.material.emissive.getHex();
        obj.material.emissive.set(this.data.highlight);
      }
    });
  },
  remove: function () {
    this.el.object3D.traverse(obj => {
      if(obj.userData.originalEmissive || obj.userData.originalEmissive === 0) {
        obj.material.emissive.setHex(obj.userData.originalEmissive);
        delete(obj.userData.originalEmissive);
      }
    });
  },
});

AFRAME.registerComponent('openable-drawer', {
  init: function () {
    this.el.addEventListener('click', function (evt) {
      move(this, this.object3D.position.z > 0 ? -1: 1);
    });
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
