/* eslint-disable */

const CAMERA_FOV = () => window.innerWidth > window.innerHeight ? 50 : 100;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const CAMERA_DISTANCE = 8;
const CAMERA_HEIGHT = 6;
const SCENE_BACKGROUND = 0x00000000; // 0xAAFAFF;
const FOG_COLOR = 0xEEDDEE;
const FOG_NEAR = 0.04;
const FOG_FAR = 40;
const LIGHT_AMBIENT_COLOR = 0xFAF8FF;
const LIGHT_AMBIENT_INTENSITY = 0.5;
const LIGHT_DIRECTIONAL_COLOR = 0xFFFFFF;
const LIGHT_DIRECTIONAL_INTENSITY = 0.5;
const GROUND_SIZE = 24;
const GROUND_SEGMENTS = 24;
const GROUND_OFFSET = -1.5;
const GROUND_DEPTH = 3;
const GROUND_COLOR = 0xAA6655;
const GROUND_SEED = 'a3i3dksjw2';
const GROUND_SEED_OFFSET_X = 0.1;
const GROUND_SEED_OFFSET_Y = 0.15;
const GROUND_DEFORM = 2;
const GROUND_DEFORM_LIMIT = 10;
const JITTER_MAGNITUDE = 0.0;
const WATER_SIZE = 24;
const WATER_SEGMENTS = 20;
const WATER_COLOR = 0x5ACAFA;
const WATER_MAGNITUDE = 0.15;
const WATER_VELOCITY = -1.75;
const WATER_OFFSET = -1.5;
const CLOUD_SEED = 'sdask';

class Project {
	constructor() {
    this.scene = new THREE.Scene();
    //this.scene.background = new THREE.Color(SCENE_BACKGROUND);
    this.scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

    this.createGeometry();
    this.createLights();

    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV(), 1, CAMERA_NEAR, CAMERA_FAR);
    this.camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
    this.camera.lookAt(this.ground.position);

    this.renderer = new THREE.WebGLRenderer({ antialias:true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.querySelector('.wrapper')
    	.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.minPolarAngle = this.controls.maxPolarAngle;
    this.controls.maxZoom = 15;
    this.controls.maxDistance = 15;

    this.updateView();
    window.addEventListener('resize', this.updateView.bind(this));

    this.redraw = this.redraw.bind(this);
    requestAnimationFrame(this.redraw);

  }

  createGeometry() {
  	const groundNoise = new SimplexNoise(GROUND_SEED);
    const groundGeo = new THREE.PlaneGeometry(
    	GROUND_SIZE, GROUND_SIZE,
    	GROUND_SEGMENTS, GROUND_SEGMENTS,
    );
    const groundCenter = GROUND_SEGMENTS / 2;
    groundGeo.initialValues = [];
    groundGeo.vertices.forEach((vertex, i) => {
    	const x = i % GROUND_SEGMENTS;
      const y = Math.floor(i / GROUND_SEGMENTS);
      const distance = GROUND_DEFORM_LIMIT - Math.min(GROUND_DEFORM_LIMIT, (Math.sqrt(
      	Math.abs(x - groundCenter) ** 2
        + Math.abs(y - groundCenter) ** 2
      ) - 1));
      const noise = groundNoise.noise2D(
      	x * GROUND_SEED_OFFSET_X,
        y * GROUND_SEED_OFFSET_Y,
      );
      vertex.z = (noise * GROUND_DEPTH + distance * GROUND_DEFORM) - GROUND_OFFSET;
    	groundGeo.initialValues[i] = new THREE.Vector3(vertex.x, vertex.y, vertex.z);
    });
    groundGeo.verticesNeedUpdate = true;
    const groundMat = new THREE.MeshPhongMaterial({
    	color: GROUND_COLOR, side: THREE.DoubleSide, flatShading: true,
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.set(Math.PI / 2, 0, 0);
    this.scene.add(this.ground);


    const waterGeo = new THREE.PlaneGeometry(
    	WATER_SIZE, WATER_SIZE,
    	WATER_SEGMENTS, WATER_SEGMENTS,
    );
    waterGeo.initialValues = [];
    waterGeo.vertices.forEach((vertex, i) => {
      vertex.z = Math.random() * 0.025;
    	waterGeo.initialValues[i] = new THREE.Vector3(vertex.x, vertex.y, vertex.z);
    });
    waterGeo.verticesNeedUpdate = true;
    const waterMat = new THREE.MeshPhongMaterial({
    	color: WATER_COLOR,
      side: THREE.DoubleSide,
      flatShading: true,
      emissive: WATER_COLOR,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.9,
    });
    this.water = new THREE.Mesh(waterGeo, waterMat);
    this.water.rotation.set(Math.PI / 2, 0, 0);
    this.water.position.set(0, WATER_OFFSET, 0);
    this.scene.add(this.water);

    const cloudNoise = new SimplexNoise(CLOUD_SEED);
		const cloudGeo = new THREE.SphereGeometry(20, 2, 5);
    cloudGeo.vertices.forEach((vertex, i) => {
      vertex.z = cloudNoise.noise2D(i) * 100;
    });
    cloudGeo.verticesNeedUpdate = true;
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const cloudDefaultScale = [1, 0.5, 0.05];
    const cloudDefaultPosition = [0, 10, -100];
    this.cloudConfigs = [
    	{ scale: [1.5, 0.6, 1], position: [-120, 0, -150] },
    	{ scale: [2, 0.6, 1], position: [20, -2, -20] },
    	{ scale: [1.5, 0.75, 1], position: [-300, -3, -10] },
    	{ scale: [2, 0.6, 1], position: [-250, -2, -80] },
    ];
    this.clouds = [];
    this.cloudConfigs.forEach((cloudConfig) => {
      const cloud = new THREE.Mesh(
      	cloudGeo.clone(),
        cloudMat.clone(),
      );
      cloud.geometry.scale(
      	cloudDefaultScale[0] * cloudConfig.scale[0],
      	cloudDefaultScale[1] * cloudConfig.scale[1],
      	cloudDefaultScale[2] * cloudConfig.scale[2],
      );
      cloud.position.set(
      	cloudDefaultPosition[0] + cloudConfig.position[0],
      	cloudDefaultPosition[1] + cloudConfig.position[1],
      	cloudDefaultPosition[2] + cloudConfig.position[2],
      );
      this.clouds.push(cloud);
      this.scene.add(cloud);
    });

    const heartShape = new THREE.Shape();
    heartShape.moveTo(25, 25);
    heartShape.bezierCurveTo(25, 25, 20, 0, 0, 0);
    heartShape.bezierCurveTo(-30, 0, -30, 35, -30, 35);
    heartShape.bezierCurveTo(-30, 55, -10, 77, 25, 95);
    heartShape.bezierCurveTo(60, 77, 80, 55, 80, 35);
    heartShape.bezierCurveTo(80, 35, 80, 0, 50, 0);
    heartShape.bezierCurveTo(35, 0, 25, 25, 25, 25);
    const heartGeo = new THREE.ExtrudeBufferGeometry(heartShape, {
      depth: 25,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 1,
      bevelThickness: 1,
    });
    heartGeo.scale(0.025, 0.025, 0.025);
    heartGeo.center();
    this.heart = new THREE.Mesh(heartGeo, new THREE.MeshPhongMaterial({
    	color: 0xFF0005,
    }));
    this.heartRotation = [Math.PI * 0.95, Math.PI * 0.01, Math.PI * 0.0002];
    this.heart.rotation.set(...this.heartRotation);
    this.heart.position.set(1, 2, 2);
    this.scene.add(this.heart);
  }

  createLights() {
    // Ambient
    this.lightAmbient = new THREE.AmbientLight(
    	LIGHT_AMBIENT_COLOR,
      LIGHT_AMBIENT_INTENSITY,
    );
    this.scene.add(this.lightAmbient);

    // Directional
    this.lightDirectional = new THREE.DirectionalLight(
    	LIGHT_DIRECTIONAL_COLOR,
      LIGHT_DIRECTIONAL_INTENSITY,
    );
    this.lightDirectional.castShadow = true;
    this.lightDirectional.position.set(0, 10, 10);
    this.lightDirectional.lookAt(this.ground.position);
    this.scene.add(this.lightDirectional);
		//this.scene.add(new THREE.DirectionalLightHelper(this.lightDirectional, 5, 0xFF0000));

  }

  updateView() {
  	const { width, height } = this.renderer.domElement.getBoundingClientRect();
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.fov = CAMERA_FOV();
    this.camera.updateProjectionMatrix();
  }

  redraw() {
    requestAnimationFrame(this.redraw);

    if (JITTER_MAGNITUDE > 0) {
      const { geometry } = this.ground;
      const { initialValues } = geometry;
      geometry.vertices.forEach((vertex, i) => {
        vertex.x = initialValues[i].x + Math.random() * JITTER_MAGNITUDE;
        vertex.y = initialValues[i].y + Math.random() * JITTER_MAGNITUDE;
        vertex.z = initialValues[i].z + Math.random() * JITTER_MAGNITUDE;
      });
      geometry.verticesNeedUpdate = true;
    }

    if (WATER_MAGNITUDE > 0) {
      const { geometry } = this.water;
      const { initialValues } = geometry;
      const timeDelta = this.clock.getElapsedTime();
      geometry.vertices.forEach((vertex, i) => {
      	const x = i % WATER_SEGMENTS;
        const y = Math.floor(i / WATER_SEGMENTS);
        const iter = Math.sqrt(x ** 2 + y ** 2) * (WATER_SIZE / 5);
        vertex.x = initialValues[i].x
        	+ Math.sin((timeDelta + iter) * WATER_VELOCITY)
          * (WATER_MAGNITUDE * 0.5);
        vertex.y = initialValues[i].y
        	+ Math.sin((timeDelta + iter) * WATER_VELOCITY)
          * (WATER_MAGNITUDE * 0.5);
        vertex.z = initialValues[i].z
        	+ Math.sin((timeDelta + iter) * WATER_VELOCITY)
          * WATER_MAGNITUDE;
      });
      geometry.verticesNeedUpdate = true;
    }

    this.heart.rotation.y = this.heartRotation[1]
    	+ Math.sin(this.clock.elapsedTime * 5) / 25;
    this.heart.scale.x = 1 + Math.sin(this.clock.elapsedTime) / 20;
    this.heart.scale.y = 1 - Math.sin(this.clock.elapsedTime) / 20;

    this.clouds.forEach((cloud, i) => {
	    cloud.position.x = (this.cloudConfigs[i].position[0]
      	+ this.clock.elapsedTime * 2);
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

class Music {
    constructor(url, container) {
        this.audio = new Audio(url);
        this.audio.ontimeupdate = this.tick.bind(this);
        this.audio.loop = true;

        this.container = container || document.body;
    }
    play() {
        this.audio.play();
    }
    pause() {
        this.audio.pause();
    }
    tick() {
        const position = this.audio.currentTime / this.audio.duration;
        if (position === 1) {
            this.audio.currentTime = 0;
            this.audio.play();
        }
    }
    get playing() {
        return !this.audio.paused;
    }
    get paused() {
        return this.audio.paused;
    }
}

let project;
const music = new Music('./ai-2020.mp3');

document.addEventListener('click', () => {
	if (!music.playing) {
    document.body.classList.add('playing');
    project = new Project();
    music.play();
  }
});
