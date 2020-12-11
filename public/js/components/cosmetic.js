AFRAME.registerComponent('outlined', {
  schema: {
    colour: {type:'color', default:'#ff0000'},
    opacity: {type:'number', default:'1'},
    thickness: {type:'number', default:'0.01'},
  },
  init: function () {
    const uniforms = {
      offset: {
        type: "f",
        value: this.data.thickness
      }
    };
    const colour = new THREE.Color(this.data.colour);
    const matShader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: ["uniform float offset;", "void main() {", "vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );", "gl_Position = projectionMatrix * pos;", "}"].join("\n"),
      fragmentShader: ["void main(){", `gl_FragColor = vec4( ${colour.r}, ${colour.g}, ${colour.b}, ${this.data.opacity} );`, "}"].join("\n")
    });

    var geometry = this.el.object3DMap.mesh.geometry;
    var existingMesh = this.el.object3DMap.mesh;

    var highlightMesh = new THREE.Mesh(geometry, matShader);
    highlightMesh.material.depthWrite = false;
    highlightMesh.quaternion = existingMesh.quaternion;

    highlightMesh.renderOrder = 1;
    existingMesh.renderOrder = 2;

    existingMesh.material.transparent= true;
    highlightMesh.material.transparent= true;

    this.el.object3D.add(highlightMesh);
  },
  remove: function () {
  },
});



// Show object ina highlighted state
AFRAME.registerComponent('halo', {
  schema: {
    highlight: {type: 'color', default: '#606060'}
  },
  init: function () {
    this.el.object3D.traverse(obj => {
      if(obj.material && typeof obj.material.emissive !== 'undefined' && typeof obj.material.originalEmissive === 'undefined') {
        obj.material.originalEmissive = obj.material.emissive.getHex();
        obj.material.emissive.set(this.data.highlight);
        obj.material.originalEmissiveIntensity = obj.material.emissiveIntensity;
        obj.material.emissiveIntensity = 0.5;
      }
    });
  },
  remove: function () {
    this.el.object3D.traverse(obj => {
      if(obj.material && typeof obj.material.emissive !== 'undefined' && typeof obj.material.originalEmissive !== 'undefined') {
        obj.material.emissive.setHex(obj.material.originalEmissive);
        obj.material.emissiveIntensity = obj.material.originalEmissiveIntensity;
        delete(obj.material.originalEmissive);
        delete(obj.material.originalEmissiveIntensity);
      }
    });
  },
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
