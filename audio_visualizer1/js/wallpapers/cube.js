var wallpaperCube = (() => {

	var scene, sceneCube, camera;
	var cube, triangles;
	var composer, glitchPass;
	var mouseX, mouseXOnMouseDown;
	var targetRotation, targetRotationOnMouseDown;
	var audioPeakValue, lastPeakValue, audioStopped;

	var init = (renderer) => {
		targetRotation = 0;
		targetRotationOnMouseDown = 0;
		audioPeakValue = 1;
		lastPeakValue = 1;

		scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0xefd1b5, 300);

		sceneCube = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.set(200, 200, 200);
		camera.lookAt(scene.position);

		var pointLight = new THREE.PointLight(0xff2200);
		pointLight.position.set(400, 400, 400);
		scene.add(pointLight);

		var pointLight = new THREE.PointLight(0x0022ff);
		pointLight.position.set(-400, 400, 400);
		scene.add(pointLight);

		scene.add(new THREE.AmbientLight(0x111111));

		var geoCube = new THREE.BoxGeometry(100, 100, 100);
		var matCube = new THREE.MeshDepthMaterial({
			wireframe: true,
			morphTargets: true
		});

		for (let i = 0; i < 8; i++) {
			var vertices = [];
			for (let v = 0; v < geoCube.vertices.length; v++) {
				vertices.push(geoCube.vertices[v].clone());
				if (v === i) {
					vertices[vertices.length - 1].x *= 2;
					vertices[vertices.length - 1].y *= 2;
					vertices[vertices.length - 1].z *= 2;
				}
			}
			geoCube.morphTargets.push({ name: "target" + i, vertices });
		}

		cube = new THREE.Mesh(geoCube, matCube);
		sceneCube.add(cube);

		var geoTriangles = ((count, size, space) => {
			var geometry = new THREE.BufferGeometry();
			var positions = new Float32Array(count * 3 * 3);
			var normals = new Float32Array(count * 3 * 3);
			var colors = new Float32Array(count * 3 * 3);
			var color = new THREE.Color();
			var size2 = size / 2, space2 = space / 2;
			var pA = new THREE.Vector3();
			var pB = new THREE.Vector3();
			var pC = new THREE.Vector3();
			var cb = new THREE.Vector3();
			var ab = new THREE.Vector3();
			for (let i = 0; i < positions.length; i += 9) {
				// positions
				var x = Math.random() * space - space2;
				var y = Math.random() * space - space2;
				var z = Math.random() * space - space2;
				var ax = x + Math.random() * size - size2;
				var ay = y + Math.random() * size - size2;
				var az = z + Math.random() * size - size2;
				var bx = x + Math.random() * size - size2;
				var by = y + Math.random() * size - size2;
				var bz = z + Math.random() * size - size2;
				var cx = x + Math.random() * size - size2;
				var cy = y + Math.random() * size - size2;
				var cz = z + Math.random() * size - size2;
				positions[i] = ax;
				positions[i + 1] = ay;
				positions[i + 2] = az;
				positions[i + 3] = bx;
				positions[i + 4] = by;
				positions[i + 5] = bz;
				positions[i + 6] = cx;
				positions[i + 7] = cy;
				positions[i + 8] = cz;
				// flat face normals
				pA.set(ax, ay, az);
				pB.set(bx, by, bz);
				pC.set(cx, cy, cz);
				cb.subVectors(pC, pB);
				ab.subVectors(pA, pB);
				cb.cross(ab);
				cb.normalize();
				var nx = cb.x;
				var ny = cb.y;
				var nz = cb.z;
				normals[i] = nx;
				normals[i + 1] = ny;
				normals[i + 2] = nz;
				normals[i + 3] = nx;
				normals[i + 4] = ny;
				normals[i + 5] = nz;
				normals[i + 6] = nx;
				normals[i + 7] = ny;
				normals[i + 8] = nz;
				// colors
				var vx = (x / space) + 0.5;
				var vy = (y / space) + 0.5;
				var vz = (z / space) + 0.5;
				color.setRGB(vx, vy, vz);
				colors[i] = color.r;
				colors[i + 1] = color.g;
				colors[i + 2] = color.b;
				colors[i + 3] = color.r;
				colors[i + 4] = color.g;
				colors[i + 5] = color.b;
				colors[i + 6] = color.r;
				colors[i + 7] = color.g;
				colors[i + 8] = color.b;
			}
			function disposeArray() { this.array = null; }
			geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).onUpload(disposeArray));
			geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3).onUpload(disposeArray));
			geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).onUpload(disposeArray));
			geometry.computeBoundingSphere();

			return geometry;
		})(4000, 12, 1200);

		var matTriangles = new THREE.MeshPhongMaterial({
			color: 0xaaaaaa,
			specular: 0xffffff,
			shininess: 250,
			side: THREE.DoubleSide,
			vertexColors: THREE.VertexColors
		});

		triangles = new THREE.Mesh(geoTriangles, matTriangles);
		scene.add(triangles);

		composer = new THREE.EffectComposer(renderer);
		composer.addPass(new THREE.RenderPass(scene, camera));

		var size = renderer.getSize();
		// dof
		var dofPass = new THREE.BokehPass(scene, camera, {
			focus: 1.0,
			aperture: 0.75,
			maxblur: 0.01,
			width: size.width,
			height: size.height,
		});
		composer.addPass(dofPass);

		// cube
		var cubePass = new THREE.RenderPass(sceneCube, camera);
		cubePass.clear = false;
		cubePass.clearDepth = true;
		composer.addPass(cubePass);

		// glitch
		glitchPass = new THREE.GlitchPass();
		glitchPass.renderToScreen = true;
		composer.addPass(glitchPass);

		if (window.wallpaperRegisterAudioListener) {
			window.wallpaperRegisterAudioListener(audioListener);
		}

		document.addEventListener('mousedown', onDocumentMouseDown, false);
		window.addEventListener('resize', () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
			composer.setSize(window.innerWidth, window.innerHeight);
		}, false);

	};

	var render = () => {
		// triangles animation
		triangles.rotation.y += 0.008;

		// cube animation
		cube.rotation.y += (targetRotation - cube.rotation.y) * 0.05;

		composer.render();
	};

	//-----------------------------------------------------
	// events

	function audioListener(audioArray) {
		audioNormalize(audioArray);

		var groupSize = audioArray.length / 8, value;
		for (let j = 0; j < 8; j++) {
			value = 0;
			for (let i = 0; i < groupSize; i++) {
				value += audioArray[j * groupSize + i];
			}
			value /= groupSize;
			cube.morphTargetInfluences[j] = value * 2;
		}

		if (audioStopped) {
			// disable glitch
			glitchPass.uniforms['byp'].value = 1;
		} else {
			var changeRatio = Math.abs(lastPeakValue - audioPeakValue) / lastPeakValue;
			if (changeRatio > 0.85) {
				glitchPass.uniforms['byp'].value = 0;
			}
			if (changeRatio < 0.15) {
				glitchPass.uniforms['byp'].value = 1;
			}
		}

		lastPeakValue = audioPeakValue;
	}

	function audioNormalize(audioData) {
		var max = 0;

		// find max value for current frame
		for (let i = 0; i < 128; i++) {
			if (audioData[i] > max) max = audioData[i];
		}

		// adjust ratio to how fast or slow you want normalization to react volume changes
		audioPeakValue = lastPeakValue * 0.4 + max * 0.6;

		audioStopped = audioPeakValue < 0.005;

		// normalize value
		for (i = 0; i < 128; i++) {
			if (audioStopped) {
				audioData[i] = 0;
			} else {
				audioData[i] /= audioPeakValue;
			}
		}
	}

	function onDocumentMouseDown(event) {
		event.preventDefault();
		document.addEventListener('mousemove', onDocumentMouseMove, false);
		document.addEventListener('mouseup', onDocumentMouseUp, false);
		mouseXOnMouseDown = event.clientX - window.innerWidth / 2;
		targetRotationOnMouseDown = targetRotation;
	}

	function onDocumentMouseMove(event) {
		mouseX = event.clientX - window.innerWidth / 2;
		targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
	}

	function onDocumentMouseUp(event) {
		document.removeEventListener('mousemove', onDocumentMouseMove, false);
		document.removeEventListener('mouseup', onDocumentMouseUp, false);
	}

	//-----------------------------------------------------

	return {
		init, render
	};

})();
