AFRAME.registerComponent('halo', {
  schema: {
    color: {type:'color', default:'#ff0000'},
    opacity: {type:'number', default:0.25},
    thickness: {type:'vec3', default: new THREE.Vector3(0.02, 0.02, 0.02)},
  },
  init: function () {

    this.highlightObject = (existingMesh) => {
      if(existingMesh instanceof THREE.Mesh && !existingMesh.userData.highlightMesh) {

        let geometry = new THREE.Geometry().fromBufferGeometry(existingMesh.geometry);
        geometry.mergeVertices();
        geometry.computeVertexNormals();

        var highlightMesh = new THREE.Mesh(geometry, this.shaderMaterial);

        highlightMesh.userData.highlightMesh = true;
        highlightMesh.material.depthWrite = false;
        highlightMesh.quaternion = existingMesh.quaternion;

        highlightMesh.renderOrder = 1;
        existingMesh.renderOrder = 2;

        existingMesh.material.transparent = true;
        highlightMesh.material.transparent = true;

        existingMesh.parent.add(highlightMesh);
      }
    };

    this.recursiveRemoveHighlight = (rootObj) => {
      rootObj.traverse(obj => {
        if(obj.userData.highlightMesh) {
          obj.parent.remove(obj);
        }
      });
    };

    this.recursiveHighlight = (rootObj) => {
      rootObj.traverse(obj => {
        if(obj.isGroup && obj.children.length === 0) {
          this.el.addEventListener('model-loaded', () => {
            this.recursiveHighlight(obj);
          });
        }
        else {
          this.highlightObject(obj);
        }
      });
    };
  },
  remove: function () {
    this.recursiveRemoveHighlight(this.el.object3D);
  },
  update: function (oldData) {

    const thickness = new THREE.Vector3(this.data.thickness.x, this.data.thickness.y, this.data.thickness.z);
    const scale = this.el.getAttribute('scale') || THREE.Vector3(1,1,1);
    const color = new THREE.Color(this.data.color);
    const uniforms = {
      offset: {
        type: "vec3",
        value: thickness.divide(scale)
      },
      opacity: {
        type: "float",
        value: this.data.opacity
      },
      color: {
        type: "vec3",
        value: color
      }
    };
    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader:`
      uniform vec3 offset;
      void main() {
        vec4 pos = modelViewMatrix * vec4( position + (normalize(normal) * offset), 1.0 );
        gl_Position = projectionMatrix * pos;
      }
      `,
      fragmentShader:`
      uniform float opacity;
      uniform vec3 color;
      void main() {
        gl_FragColor = vec4( color, opacity );
      }
      `,
      side: THREE.DoubleSide,
    });

    this.recursiveRemoveHighlight(this.el.object3D);
    this.recursiveHighlight(this.el.object3D);
  }
});



// Show object ina highlighted state
AFRAME.registerComponent('highlight', {
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
