window.onload = () => {
	var img = document.getElementById('main-img');
	var width = img.clientWidth;
	var height = img.clientHeight;
	var offset_x = 0;
	var offset_y = 0;
	var shift_x = 0;
	var shift_y = 0;

	onWindowResize();

	window.addEventListener('resize', onWindowResize, false);
	document.addEventListener('mousemove', onDocumentMouseMove, false);

	function onWindowResize() {
		offset_x = (window.innerWidth - width) / 2;
		offset_y = (window.innerHeight - height) / 2;
		img.style.right = offset_x;
		img.style.top = offset_y;
	}

	function onDocumentMouseMove(event) {
		var w_width = window.innerWidth;
		if (width > w_width) {
			shift_x = 2 * (event.clientX - w_width / 2) / w_width;
			var target_x = offset_x - shift_x * offset_x;
			// img.style.right = target_x;
			TweenLite.to(img, 1, { right: target_x });
		}
		var w_height = window.innerHeight;
		if (height > w_height) {
			shift_y = 2 * (event.clientY - w_height / 2) / w_height;
			var target_y = offset_y - shift_y * offset_y;
			// img.style.top = target_y;
			TweenLite.to(img, 1, { top: target_y });
		}
	}
}
