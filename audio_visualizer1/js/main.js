window.onload = () => {
	var presets = [wallpaperCube, wallpaperCircle];

	var currIndex = -1;

	window.wallpaperPropertyListener = {
		applyUserProperties: (properties) => {
			if (properties.preset) {
				if (currIndex !== properties.preset.value) {
					currIndex = properties.preset.value;
					var old = $('canvas');
					if (old) {
						old.remove();
					}
					presets[currIndex].start();
				}
			}
		}
	}
};
