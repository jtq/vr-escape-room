AFRAME.registerComponent('interactable', {
  schema: {},
  init: function () {
    // Set up initial state and variables.

    //this.el.classList.add('interactable');

    // Intersection
    this.onIntersection = AFRAME.utils.bind(e => {
      e.preventDefault();
      e.stopPropagation();
      this.el.setAttribute('material', 'color', '#f88');
    }, this);
    // Attach event listener.
    this.el.addEventListener('raycaster-intersected', this.onIntersection);

    // De-intersection
    this.onDeintersection = AFRAME.utils.bind(e => {
      e.preventDefault();
      e.stopPropagation();
      this.el.setAttribute('material', 'color', '#fff');
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

AFRAME.registerComponent('openable-drawer', {
  init: function () {
    this.el.addEventListener('click', function (evt) {
      move(this, this.object3D.position.z > 0 ? -1: 1);
    });
  }
});

AFRAME.registerComponent('selectable-goal', {
  init: function () {
    this.el.addEventListener('click', function (evt) {
      alert('You found the Rubics Cube!');
    });
  }
});
