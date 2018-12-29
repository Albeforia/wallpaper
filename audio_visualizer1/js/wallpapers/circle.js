var wallpaperCircle = (() => {

	var scene, camera;
	var circle, geometries, radius = 85;
	var composer;
	var rgbShiftPass, shiftX;
	var clicked;
	var audioPeakValue, lastPeakValue, audioStopped;

	var init = (renderer) => {
		shiftX = 0;
		clicked = false;
		audioPeakValue = 1;

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
		var geometryCount = 128 / 2;
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
		window.addEventListener('resize', () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
			composer.setSize(window.innerWidth, window.innerHeight);
		}, false);

	};

	var render = () => {
		if (window.innerWidth > 600) {
			TweenLite.to(rgbShiftPass.uniforms.amount, 0.8, {
				value: (clicked) ? 0.005 : (shiftX / window.innerWidth)
			});
		} else {
			TweenLite.to(rgbShiftPass.uniforms.amount, 0.8, {
				value: 0.001
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
		audioNormalize(audioArray);

		var value;
		geometries.forEach((geometry, index) => {
			value = (audioArray[2 * index] + audioArray[2 * index + 1]) * 0.8;
			value = Math.max(0.01, value);
			if (clicked) {
				TweenLite.to(geometry.scale, 0.05, {
					ease: Power0.easeNone, x: value, y: value, z: value
				});
				TweenLite.to(geometry.rotation, 0.05, {
					ease: Power0.easeNone, z: (index % 2 === 0) ? '+= 0.05' : '-= 0.05'
				});
			}
			else {
				TweenLite.to(geometry.scale, 0.05, { ease: Power0.easeNone, z: value * 2.0 });
			}
		});
	}

	function audioNormalize(audioData) {
		var max = 0;

		// find max value for current frame
		for (let i = 0; i < 128; i++) {
			if (audioData[i] > max) max = audioData[i];
		}

		// adjust ratio to how fast or slow you want normalization to react volume changes
		audioPeakValue = audioPeakValue * 0.5 + max * 0.5;

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

	function onDocumentClick() {
		if (Math.abs(shiftX / window.innerWidth) > 0.05) return;
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
					x: `+= ${randomInt(-600, 600)}`,
					y: `+= ${randomInt(-600, 600)}`,
					z: `+= ${randomInt(-500, -250)}`
				});
			});

			clicked = true;
		}
	}

	function onDocumentMouseMove(event) {
		shiftX = event.clientX - window.innerWidth / 2;
	}

	//-----------------------------------------------------

	return {
		init, render
	};

})();
