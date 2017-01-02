var wallpaperCircle = (() => {

	var scene, camera;
	var renderer, composer;
	var circle, geometries, radius = 100;
	var rgbShiftPass, shiftX = 0;
	var clicked = false;

	var init = () => {
		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.z = 350;

		var light = new THREE.DirectionalLight();
		light.position.set(1, 1, 1);
		scene.add(light);

		var light = new THREE.DirectionalLight();
		light.position.set(-1, -1, 1);
		scene.add(light);

		circle = new THREE.Object3D();
		geometries = [];
		var geometryCount = 80;
		var geometrySleeves = [];
		var geometryTypes = [
			new THREE.OctahedronGeometry(40, 0)
		];

		const type = randomInt(0, geometryTypes.length - 1);
		for (let i = 0; i < geometryCount; i++) {
			geometries[i] = new THREE.Mesh(
				geometryTypes[type],
				new THREE.MeshPhongMaterial({
					wireframe: true
				})
			);

			geometries[i].position.y = radius;

			geometrySleeves[i] = new THREE.Object3D();
			geometrySleeves[i].rotation.z = i * (360 / geometryCount) * Math.PI / 180;
			geometrySleeves[i].add(geometries[i]);

			circle.add(geometrySleeves[i]);
		}

		scene.add(circle);

		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);

		composer = new THREE.EffectComposer(renderer);
		composer.addPass(new THREE.RenderPass(scene, camera));

		// rgb shift
		rgbShiftPass = new THREE.ShaderPass(THREE.RGBShiftShader);
		rgbShiftPass.uniforms.amount.value = 0.005;
		rgbShiftPass.renderToScreen = true;
		composer.addPass(rgbShiftPass);

		if (window.wallpaperRegisterAudioListener) {
			window.wallpaperRegisterAudioListener(audioListener);
		}

		document.addEventListener('click', onDocumentClick, false);
		document.addEventListener('mousemove', onDocumentMouseMove, false);
		window.addEventListener('resize', onWindowResize, false);
	};

	var render = () => {
		requestAnimationFrame(render);

		if (window.innerWidth > 600) {
			TweenLite.to(rgbShiftPass.uniforms.amount, 0.8, {
				value: (clicked) ? 0.005 : (shiftX / window.innerWidth)
			});
		} else {
			TweenLite.to(rgbShiftPass.uniforms.amount, 0.8, {
				value: 0.01
			});
		}

		circle.rotation.z += 0.01;

		composer.render();
	};

	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	//-----------------------------------------------------
	// events

	function audioListener(audioArray) {
		var value;
		geometries.forEach((geometry, index) => {
			// assert(geometryCount === 80)
			value = (audioArray[2 * index] + audioArray[2 * index + 1]) * 0.5 * 8;
			if (clicked) {
				TweenLite.to(geometry.scale, 0.05, {
					ease: Power0.easeNone, x: value, y: value, z: value
				});
				TweenLite.to(geometry.rotation, 0.05, {
					ease: Power0.easeNone, z: (index % 2 === 0) ? '+= 0.05' : '-= 0.05'
				});
			}
			else {
				TweenLite.to(geometry.scale, 0.05, { ease: Power0.easeNone, z: value });
			}
		});
	}

	function onDocumentClick() {
		if (clicked) {
			geometries.forEach((geometry, index) => {
				TweenLite.to(geometry.scale, 1, { x: 1, y: 1, z: 1 });
				TweenLite.to(geometry.rotation, 1, { x: 0, y: 0, z: 0 });
				TweenLite.to(geometry.position, 1, { x: 0, y: radius, z: 0 });
			});

			clicked = false;
		}
		else {
			geometries.forEach((geometry, index) => {
				TweenLite.to(geometry.rotation, 1, {
					x: randomInt(0, Math.PI),
					y: randomInt(0, Math.PI),
					z: randomInt(0, Math.PI)
				});
				TweenLite.to(geometry.position, 1, {
					x: `+= ${randomInt(-800, 800)}`,
					y: `+= ${randomInt(-800, 800)}`,
					z: `+= ${randomInt(-500, -250)}`
				});
			});

			clicked = true;
		}
	}

	function onDocumentMouseMove(event) {
		shiftX = event.clientX - window.innerWidth / 2;
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		composer.setSize(window.innerWidth, window.innerHeight);
	}

	//-----------------------------------------------------

	return {
		start: function () {
			init();
			render();
		}
	};

})();
