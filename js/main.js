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

	var mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	var points = new THREE.Geometry(), vertex;
	for (i = 0; i < 1200; i++) {
		vertex = new THREE.Vector3();
		vertex.x = Math.random() * 1200 - 600;
		vertex.y = Math.random() * 1200 - 600;
		vertex.z = Math.random() * 1200 - 600;
		points.vertices.push(vertex);
	}

	var parameters = [
		[[1, 1, 0.5], 5],
		//[[0.95, 1, 0.5], 4],
		//[[0.90, 1, 0.5], 3],
		//[[0.85, 1, 0.5], 2],
		//[[0.80, 1, 0.5], 1]
	];
	var color, size, materials = [], particles = [];
	for (i = 0; i < parameters.length; i++) {
		size = parameters[i][1];
		materials[i] = new THREE.PointsMaterial({ size });
		particles[i] = new THREE.Points(points, materials[i]);
		particles[i].rotation.x = Math.random() * 6;
		particles[i].rotation.y = Math.random() * 6;
		particles[i].rotation.z = Math.random() * 6;
		scene.add(particles[i]);
	}

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x222222);
	document.body.appendChild(renderer.domElement);

	// postprocessing
	var composer = new THREE.EffectComposer(renderer);
	composer.addPass(new THREE.RenderPass(scene, camera));

	var glitchPass = new THREE.GlitchPass();
	glitchPass.renderToScreen = true;
	composer.addPass(glitchPass);

	var mouseX, mouseXOnMouseDown;
	var targetRotation = 0, targetRotationOnMouseDown = 0;

	var render = () => {
		requestAnimationFrame(render);

		mesh.rotation.y += (targetRotation - mesh.rotation.y) * 0.05;

		var time = Date.now() * 0.00005;
		var i, h;
		for (i = 0; i < materials.length; i++) {
			color = parameters[i][0];
			h = (360 * (color[0] + time) % 360) / 360;
			materials[i].color.setHSL(h, color[1], color[2]);
		}

		for (i = 0; i < particles.length; i++) {
			particles[i].rotation.y += 0.005;
		}

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
			mesh.morphTargetInfluences[j] = value * 5;
		}
	}

	window.wallpaperRegisterAudioListener(audioListener);

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
