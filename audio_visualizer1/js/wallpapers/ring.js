var wallpaperRing = (() => {

	var scene, camera;
	var occlScene, volLight;
	var cube, cubeOccl;
	var renderer, occlComposer, composer;
	var godraysPass, blendingPass;
	var controls;

	var init = () => {
		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.set(0, 0, 300);
		camera.lookAt(scene.position);

		var pointLight = new THREE.PointLight();
		scene.add(pointLight);

		scene.add(new THREE.AmbientLight(0x111111));

		occlScene = new THREE.Scene();
		occlScene.add(new THREE.AmbientLight());

		// light volume
		volLight = new THREE.Mesh(
			new THREE.IcosahedronGeometry(50, 3),
			new THREE.MeshBasicMaterial()
		);
		occlScene.add(volLight);

		var geoCube = new THREE.TorusGeometry(120, 8, 16, 100);
		var matCube = new THREE.MeshLambertMaterial();
		cube = new THREE.Mesh(geoCube, matCube);
		scene.add(cube);

		// duplicate in occlusion scene
		var matCubeOccl = new THREE.MeshBasicMaterial({ color: 0x000000 });
		cubeOccl = new THREE.Mesh(geoCube, matCubeOccl);
		occlScene.add(cubeOccl);

		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);

		//
		controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.25;
		controls.enableZoom = false;

		// render target for occlusion scene
		var renderSize = renderer.getSize();
		var renderTargetOccl = (() => {
			var options = {
				format: THREE.RGBFormat,
				stencilBuffer: false
			};
			// half sampling
			return new THREE.WebGLRenderTarget(renderSize.width / 2, renderSize.height / 2, options);
		})();

		occlComposer = new THREE.EffectComposer(renderer, renderTargetOccl);
		occlComposer.addPass(new THREE.RenderPass(occlScene, camera));

		// blur pass
		var horizontalBlurPass = new THREE.ShaderPass(THREE.GaussianBlurShader['horizontalBlur']);
		var verticalBlurPass = new THREE.ShaderPass(THREE.GaussianBlurShader['verticalBlur']);
		const bluriness = 3;
		horizontalBlurPass.uniforms["h"].value = bluriness / renderSize.width;
		verticalBlurPass.uniforms["v"].value = bluriness / renderSize.height;
		occlComposer.addPass(horizontalBlurPass);
		occlComposer.addPass(verticalBlurPass);
		occlComposer.addPass(horizontalBlurPass);
		occlComposer.addPass(verticalBlurPass);

		// godrays pass
		godraysPass = new THREE.ShaderPass(THREE.GodraysShader);
		occlComposer.addPass(godraysPass);

		composer = new THREE.EffectComposer(renderer);
		composer.addPass(new THREE.RenderPass(scene, camera));

		// additive blending
		blendingPass = new THREE.ShaderPass(THREE.AdditiveBlendingShader);
		blendingPass.renderToScreen = true;
		composer.addPass(blendingPass);

		window.addEventListener('resize', onWindowResize, false);
	};

	var render = () => {
		requestAnimationFrame(render);

		// volLight.position.y -= 0.1;
		// cube.rotation.y += 0.01;
		// cubeOccl.rotation.copy(cube.rotation);

		controls.update();

		// update light
		var screenPos = projectOnScreen(volLight, camera);
		godraysPass.uniforms.fX.value = screenPos.x;
		godraysPass.uniforms.fY.value = screenPos.y;

		occlComposer.render();
		blendingPass.uniforms.tAdd.value = occlComposer.readBuffer.texture;
		composer.render();
	};

	var projectOnScreen = (object, camera) => {
		var mat = new THREE.Matrix4();
		mat.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
		mat.multiplyMatrices(camera.projectionMatrix, mat);

		var c = mat.n44;
		var lPos = new THREE.Vector3(mat.n14 / c, mat.n24 / c, mat.n34 / c);
		lPos.multiplyScalar(0.5);
		lPos.addScalar(0.5);
		return lPos;
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		occlComposer.setSize(window.innerWidth, window.innerHeight);
	}

	return {
		start: function () {
			init();
			render();
		}
	};

})();
