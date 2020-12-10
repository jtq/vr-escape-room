AFRAME.registerComponent('outlined', {
  schema: {},
  init: function () {
    var shader = {
      'outline': {
        vertex_shader: ["uniform float offset;", "void main() {", "vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );", "gl_Position = projectionMatrix * pos;", "}"].join("\n"),
        fragment_shader: ["void main(){", "gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );", "}"].join("\n")
      }
    };

    var geometry, matColor, matShader, outShader, uniforms;
    geometry = this.el.object3DMap.mesh.geometry; //new THREE.TorusKnotGeometry(50, 10, 128, 16);
    matColor = this.el.object3DMap.mesh.material; //new THREE.MeshPhongMaterial(0xffffff);
    mesh1 = this.el.object3DMap.mesh; //new THREE.Mesh(geometry, matColor);
    //scene.add(mesh1);
    uniforms = {
      offset: {
        type: "f",
        value: 0.02
      }
    };
    outShader = shader['outline'];
    matShader = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: outShader.vertex_shader,
      fragmentShader: outShader.fragment_shader,
    });
    mesh3 = new THREE.Mesh(geometry, matShader);
    mesh3.material.depthWrite = false;
    mesh3.quaternion = mesh1.quaternion;
    mesh3.renderOrder = 1;
    mesh1.renderOrder = 2;
    this.el.object3D.add(mesh3);
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
