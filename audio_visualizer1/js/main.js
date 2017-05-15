window.onload = () => {

	var presets = [wallpaperCube, wallpaperCircle];
	var currIndex = -1;

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	window.wallpaperPropertyListener = {
		applyUserProperties: (properties) => {
			if (properties.preset) {
				if (currIndex !== properties.preset.value) {
					currIndex = properties.preset.value;
					presets[currIndex].init(renderer);
				}
			}
		}
	}

	mainLoop();

	function mainLoop() {
		requestAnimationFrame(mainLoop);
		presets[currIndex].render();
	}

};
