window.onload = () => {
	var scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xefd1b5, 300);

	var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(200, 200, 200);
	camera.lookAt(scene.position);

	var light = new THREE.PointLight(0xff2200);
	light.position.set(300, 400, 400);
	scene.add(light);

	var light = new THREE.AmbientLight(0x111111);
	scene.add(light);

	var geometry = new THREE.BoxGeometry(100, 100, 100);
	var material = new THREE.MeshLambertMaterial({
		morphTargets: true
	});

	// construct 8 blend shapes
	var i, j;
	for (i = 0; i < 8; i++) {
		var vertices = [];
		for (var v = 0; v < geometry.vertices.length; v++) {
			vertices.push(geometry.vertices[v].clone());
			if (v === i) {
				vertices[vertices.length - 1].x *= 2;
				vertices[vertices.length - 1].y *= 2;
				vertices[vertices.length - 1].z *= 2;
			}
		}
		geometry.morphTargets.push({ name: "target" + i, vertices: vertices });
	}

	var cube = new THREE.Mesh(geometry, material);
	scene.add(cube);

	var points = new THREE.Geometry(), vertex;
	for (i = 0; i < 1200; i++) {
		vertex = new THREE.Vector3();
		vertex.x = Math.random() * 1200 - 600;
		vertex.y = Math.random() * 1200 - 600;
		vertex.z = Math.random() * 1200 - 600;
		points.vertices.push(vertex);
	}

	var particleParams = [[1, 1, 0.5], 5];
	var particleMaterial0 = new THREE.PointsMaterial({ size: particleParams[1] });
	var particle = new THREE.Points(points, particleMaterial0);
	particle.rotation.x = Math.random() * 6;
	particle.rotation.y = Math.random() * 6;
	particle.rotation.z = Math.random() * 6;
	scene.add(particle);

	var particleMaterial1 = new THREE.RawShaderMaterial({
		vertexShader: document.querySelector('#motionvector-vert').textContent.trim(),
		fragmentShader: document.querySelector('#motionvector-frag').textContent.trim(),
		uniforms: {
			prevModelViewMatrix: { value: new THREE.Matrix4() }
		}
	});

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	// renderer.setClearColor(0x222222);
	document.body.appendChild(renderer.domElement);

	// render target for motion vector
	var renderTarget = (() => {
		var options = {
			format: THREE.RGBFormat,
			type: THREE.FloatType,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			generateMipmaps: false,
			stencilBuffer: false
		};
		var size = renderer.getSize();
		target = new THREE.WebGLRenderTarget(size.width, size.height, options);
		return target;
	})();

	var composer = new THREE.EffectComposer(renderer);
	composer.addPass(new THREE.RenderPass(scene, camera));

	// motion blur
	var blurMaterial = new THREE.RawShaderMaterial({
		vertexShader: document.querySelector('#motionblur-vert').textContent.trim(),
		fragmentShader: document.querySelector('#motionblur-frag').textContent.trim(),
		uniforms: {
			tDiffuse: { type: 't' },
			tMotion: { type: 't', value: renderTarget.texture }
		}
	});
	var blurPass = new THREE.ShaderPass(blurMaterial);
	composer.addPass(blurPass);

	// glitch
	var glitchPass = new THREE.GlitchPass();
	glitchPass.renderToScreen = true;
	composer.addPass(glitchPass);

	var mouseX, mouseXOnMouseDown;
	var targetRotation = 0, targetRotationOnMouseDown = 0;

	var prevModelViewMatrix = new THREE.Matrix4();

	var render = () => {
		requestAnimationFrame(render);

		// particle animation
		var time = Date.now() * 0.00005;
		var particleColor = particleParams[0];
		var hue = (360 * (particleColor[0] + time) % 360) / 360;
		particleMaterial0.color.setHSL(hue, particleColor[1], particleColor[2]);
		particle.rotation.y += 0.005;

		// render particle motion vectors
		particle.material = particleMaterial1;
		particleMaterial1.uniforms.prevModelViewMatrix.value.copy(prevModelViewMatrix);
		prevModelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, particle.matrixWorld);
		scene.remove(cube);
		renderer.render(scene, camera, renderTarget);
		scene.add(cube);
		particle.material = particleMaterial0;

		// cube animation
		cube.rotation.y += (targetRotation - cube.rotation.y) * 0.05;

		composer.render();
	};

	render();

	audioListener = (audioArray) => {
		var groupSize = audioArray.length / 8, value;
		var i, j;
		for (j = 0; j < 8; j++) {
			value = 0;
			for (i = 0; i < groupSize; i++) {
				value += audioArray[j * groupSize + i];
			}
			value /= groupSize;
			cube.morphTargetInfluences[j] = value * 5;
		}
	}

	if (window.wallpaperRegisterAudioListener) {
		window.wallpaperRegisterAudioListener(audioListener);
	}

	var windowHalfX = window.innerWidth / 2;

	function onDocumentMouseDown(event) {
		event.preventDefault();
		document.addEventListener('mousemove', onDocumentMouseMove, false);
		document.addEventListener('mouseup', onDocumentMouseUp, false);
		mouseXOnMouseDown = event.clientX - windowHalfX;
		targetRotationOnMouseDown = targetRotation;
	}

	function onDocumentMouseMove(event) {
		mouseX = event.clientX - windowHalfX;
		targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
	}

	function onDocumentMouseUp(event) {
		document.removeEventListener('mousemove', onDocumentMouseMove, false);
		document.removeEventListener('mouseup', onDocumentMouseUp, false);
	}

	document.addEventListener('mousedown', onDocumentMouseDown, false);

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		composer.setSize(window.innerWidth, window.innerHeight);
	}

	window.addEventListener('resize', onWindowResize, false);
};
