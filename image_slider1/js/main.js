window.onload = () => {
	var images = document.getElementsByClassName('main-img');
	var current = 0, img = images[current];
	var offset_x = 0;
	var offset_y = 0;
	var shift_x = 0;
	var shift_y = 0;

	onWindowResize();

	window.addEventListener('resize', onWindowResize, false);
	document.addEventListener('mousemove', onDocumentMouseMove, false);

	img.style.opacity = 1;
	setInterval(switchImage, 10 * 1000);

	function onWindowResize() {
		offset_x = (window.innerWidth - img.clientWidth) / 2;
		offset_y = (window.innerHeight - img.clientHeight) / 2;
		img.style.right = offset_x;
		img.style.top = offset_y;
	}

	function onDocumentMouseMove(event) {
		var w_width = window.innerWidth;
		if (img.clientWidth > w_width) {
			shift_x = 2 * (event.clientX - w_width / 2) / w_width;
			var target_x = offset_x - shift_x * offset_x;
			// img.style.right = target_x;
			TweenLite.to(img, 1, { right: target_x });
		}
		var w_height = window.innerHeight;
		if (img.clientHeight > w_height) {
			shift_y = -2 * (event.clientY - w_height / 2) / w_height;
			var target_y = offset_y - shift_y * offset_y;
			// img.style.top = target_y;
			TweenLite.to(img, 1, { top: target_y });
		}
	}

	function switchImage() {
		var curr = images[current];
		current = (current + 1) % images.length;
		var next = images[current];
		img = next;
		onWindowResize();
		TweenLite.to(curr, 1.2, { opacity: 0, ease: Power0.easeNone });
		TweenLite.to(next, 1.2, { opacity: 1, ease: Power0.easeNone });
	}
}
