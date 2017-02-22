/**
 * Depth-of-field post-process with bokeh shader
 */

THREE.BokehPass = function (scene, camera, params, prePass, postPass) {

	THREE.Pass.call(this);

	this.scene = scene;
	this.camera = camera;

	var focus = (params.focus !== undefined) ? params.focus : 1.0;
	var aspect = (params.aspect !== undefined) ? params.aspect : camera.aspect;
	var aperture = (params.aperture !== undefined) ? params.aperture : 0.025;
	var maxblur = (params.maxblur !== undefined) ? params.maxblur : 1.0;
	var shape = (params.shape !== undefined) ? params.shape : 0;

	// render targets
	var width = params.width || window.innerWidth || 1;
	var height = params.height || window.innerHeight || 1;

	this.renderTargetDepth = new THREE.WebGLRenderTarget(width, height, {
		format: THREE.RGBFormat
	});

	// depth material
	this.materialDepth = new THREE.MeshDepthMaterial();

	// bokeh material
	if (THREE.BokehShader === undefined) {
		console.error("THREE.BokehPass relies on THREE.BokehShader");
	}

	var shader = THREE.BokehShader;
	this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

	this.uniforms["tDepth"].value = this.renderTargetDepth.texture;
	this.uniforms["focus"].value = focus;
	this.uniforms["aspect"].value = aspect;
	this.uniforms["aperture"].value = aperture;
	this.uniforms["maxblur"].value = maxblur;
	this.uniforms["shape"].value = shape;

	this.materialBokeh = new THREE.ShaderMaterial({
		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});

	this.camera2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	this.scene2 = new THREE.Scene();
	this.quad2 = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
	this.scene2.add(this.quad2);

};

THREE.BokehPass.prototype = Object.assign(Object.create(THREE.Pass.prototype), {

	constructor: THREE.BokehPass,

	render: function (renderer, writeBuffer, readBuffer, delta, maskActive) {

		this.quad2.material = this.materialBokeh;

		// render depth into texture
		this.scene.overrideMaterial = this.materialDepth;
		renderer.render(this.scene, this.camera, this.renderTargetDepth, true);

		// render bokeh composite
		this.uniforms["tColor"].value = readBuffer.texture;

		if (this.renderToScreen) {
			renderer.render(this.scene2, this.camera2);
		}
		else {
			renderer.render(this.scene2, this.camera2, writeBuffer, this.clear);
		}

		this.scene.overrideMaterial = null;

	}

});
