// http://http.developer.nvidia.com/GPUGems3/gpugems3_ch13.html

THREE.GodraysShader = {

	uniforms: {

		"tDiffuse": { value: null }, // occlusion buffer
		"fX": { value: 0.5 }, // screen coordinates of the light
		"fY": { value: 0.5 }, // screen coordinates of the light
		"fExposure": { value: 0.5 },
		"fDecay": { value: 0.9 },
		"fDensity": { value: 0.75 },
		"fWeight": { value: 0.4 },
		"fClamp": { value: 1.0 }

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [

		"varying vec2 vUv;",

		"uniform sampler2D tDiffuse;",
		"uniform float fX;",
		"uniform float fY;",
		"uniform float fExposure;",
		"uniform float fDecay;",
		"uniform float fDensity;",
		"uniform float fWeight;",
		"uniform float fClamp;",

		"const int iSamples = 20;",

		"void main() {",

			"vec2 deltaTextCoord = vec2(vUv - vec2(fX, fY));",
			"deltaTextCoord *= 1.0 / float(iSamples) * fDensity;",
			"vec2 coord = vUv;",
			"float illuminationDecay = 1.0;",

			"vec4 FragColor = vec4(0.0);",
			"for(int i = 0; i < iSamples; i++) {",
				"coord -= deltaTextCoord;",
				"vec4 texel = texture2D(tDiffuse, coord);",
				"texel *= illuminationDecay * fWeight;",
				"FragColor += texel;",
				"illuminationDecay *= fDecay;",
			"}",

			"FragColor *= fExposure;",
			"FragColor = clamp(FragColor, 0.0, fClamp);",
			"gl_FragColor = FragColor;",

		"}"

	].join("\n")

};
