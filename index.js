window.onload=function(){
    
class Welcome {
    constructor(container, messages = []) {
        this.container = container;
        this.container.style.display = 'block';

        this.defaultScreenDuration = 1;
        this.defaultTransitionDuration = null;

        this.messages = messages;
        
        this.createIntro();
        this.createMessages();
        
        this._play = this.play.bind(this);
        this.index = -1;
    }
    
    createIntro() {
        game.controls.enabled = false;
        
        const el = document.createElement('div');
        el.classList.add('message', 'visible');
        
        const button = document.createElement('div');
        button.classList.add('button', 'start');
        button.addEventListener('click', () => {
            this.intro.addEventListener('transitionend', this._play);
            this.intro.classList.remove('visible');
            
            game.controls.enabled = true;
            music.play();
        });
        el.appendChild(button);
        
        this.intro = el;
        this.container.appendChild(el);
    }
    createMessages() {
        this.messageElements = this.messages.map(({ text, className}) => {
            const el = document.createElement('div');
            el.classList.add('message', className);
            el.textContent = text;
            this.container.appendChild(el);
            
            return el;
        });
    }
    play(event) {
        if (event && event.target) {
            event.target.removeEventListener('transitionend', this._play);
        }
        const prev = this.messageElements[this.index];
        this.index++;
        const next = this.messageElements[this.index];
        
        if (prev) {
            const prevDone = () => {
                if (next) {
                    next.classList.add('visible');
                    next.addEventListener('transitionend', () => {
                        const transitionDuration = !isNaN(next.transitionDuration) ? next.transitionDuration : this.defaultScreenDuration;
                        setTimeout(this._play, transitionDuration * 1000);
                    });
                } else {
                    this.container.classList.add('hidden');
                    document.querySelector('canvas').classList.add('in-front');
                }
                prev.removeEventListener('transitionend', prevDone);
            };
            prev.addEventListener('transitionend', prevDone);
            
            prev.classList.remove('visible');
        } else if (next) {
            next.addEventListener('transitionend', () => {
                const transitionDuration = !isNaN(next.transitionDuration) ? next.transitionDuration : this.defaultScreenDuration;
                setTimeout(this._play, transitionDuration * 1000);
            });
            setTimeout(() => {
                next.classList.add('visible');
            }, 0);
        }
    }
}

class Game {
    constructor() {
        this.seed = THREE.Math.randFloat(0.75, 1.25);
        this.fov = 40;

        const { width, height } = Game.getViewportDimensions();
        
        this.listeners = {};

        this.createScene();
        this.createLights();
        this.createParticles();
        this.createCamera({ width, height });
        this.createRenderer({ width, height });
        this.createPostProcessing({ width, height });

        document.body.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.resize.bind(this));
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        
        // Background and fog
        this.scene.background = new THREE.Color(0xcce5cf);
        this.scene.fog = new THREE.FogExp2(0xcff1f5, 0.05);
        
        // Sun
        const sunGeometry = new THREE.SphereGeometry();
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfffaaa });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(5, 5, -20);
        this.scene.add(this.sun);
        
        // Ground
        const groundSize = 22;
        const groundSegments = 18;
        const groundDepth = .5;
        const groundGeometry = new THREE.BoxGeometry(groundSize, groundSize, groundDepth, groundSegments, groundSegments, 1);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            flatShading: true,
            wireframe: false,
            vertexColors: THREE.FaceColors,
            emissive: 0x220000,
        });
        const groundBaseHue = .03;
        const groundBaseSaturation = .6;
        const groundCrossSectionColor = 0x804115;
        const groundVariationX = -.15;
        const groundVariationY = -.33;
        const groundVariationZ = -.3;
        const groundMountainSize = .4;
        const groundMountainDistanceThreshold = groundSize * 0.233;
        const groundMountainColorThreshold = 8;
        const groundCornerIncline = 1;
        //const groundCornerToCornerDistance = groundGeometry.boundingBox.max.x;

        groundGeometry.computeBoundingBox();
        const groundCenter = new THREE.Vector3(
            (groundGeometry.boundingBox.max.x + groundGeometry.boundingBox.min.x) / 2,
            (groundGeometry.boundingBox.max.y + groundGeometry.boundingBox.min.y) / 2,
            (groundGeometry.boundingBox.max.z + groundGeometry.boundingBox.min.z) / 2,
        );
        const groundCorner = new THREE.Vector3(
            groundGeometry.boundingBox.min.x,
            groundGeometry.boundingBox.max.y,
            groundGeometry.boundingBox.min.z,
        );
        
        const isNormal = {
            down: normal => Math.round(normal.z) === 1,
            up: normal => Math.round(normal.z) === -1,
            front: normal => Math.round(normal.y) === 1,
            back: normal => Math.round(normal.y) === -1,
            right: normal => Math.round(normal.x) === 1,
            left: normal => Math.round(normal.x) === -1,
        };

        groundGeometry.faces.forEach(({ a, b, c, normal, color }) => {
            if (isNormal.up(normal)) {
                // Top
                // Mutate geometry
                const vertices = [a, b, c].map(v => groundGeometry.vertices[v]);
                let faceZ = 0;
                let faceFromCorner = 0;
                vertices.forEach(vertex => {
                    const centerDistance = vertex.distanceTo(groundCenter);
                    const distanceToCorner = vertex.distanceTo(groundCorner);
                    faceFromCorner += distanceToCorner;

                    if (centerDistance <= groundMountainDistanceThreshold) {
                        const magnitude = groundMountainDistanceThreshold - centerDistance;
                        //vertex.z -= THREE.Math.smoothstep(magnitude, 0, groundMountainThreshold) * groundMountainSize;
                        vertex.z -= magnitude * groundMountainSize;
                        vertex.z -= THREE.Math.randFloatSpread(groundVariationZ * 4);
                    }

                    vertex.x -= THREE.Math.randFloatSpread(groundVariationX);
                    vertex.y -= THREE.Math.randFloatSpread(groundVariationY);
                    vertex.z = Math.min(0, vertex.z - THREE.Math.randFloatSpread(groundVariationZ));
                    vertex.z -= ((Math.PI * Math.sin(distanceToCorner / groundGeometry.boundingBox.max.x)) * .1) * groundCornerIncline;
                    faceZ += vertex.z;
                });
                faceZ /= 3;
                faceFromCorner /= 3;
                const heightRatio = Math.max(0, groundMountainColorThreshold + faceZ) / groundMountainColorThreshold;
                const cornerRatio = Math.max(0, Math.min(1, faceFromCorner / groundSize));

                // Set color
                const hue = groundBaseHue + THREE.Math.randFloatSpread(.01) + (cornerRatio * .05);
                const saturation = heightRatio * .95 - (1 - groundBaseSaturation);
                const minLightness = .35;
                const maxLightness = .8;
                const lightness = Math.max(
                    minLightness,
                    Math.min(maxLightness, 1 - cornerRatio * 0.5)
                );
                color.setHSL(hue, saturation, lightness);

            } else if (isNormal.down(normal)) {
                color.setHex(groundCrossSectionColor);

            } else if (isNormal.front(normal)) {
                color.setHex(groundCrossSectionColor);

            } else if (isNormal.back(normal)) {
                color.setHex(groundCrossSectionColor);

            } else if (isNormal.right(normal)) {
                color.setHex(groundCrossSectionColor);

            } else if (isNormal.left(normal)) {
                color.setHex(groundCrossSectionColor);
            } else {
                console.warn('Unknown normal angle', normal);
            }
        });
        groundGeometry.colorsNeedUpdate = true;
        groundGeometry.verticesNeedUpdate = true;
        groundGeometry.normalsNeedUpdate = true;
        groundGeometry.computeFaceNormals();
        groundGeometry.computeVertexNormals();

        const randomizeGround = () => {
            groundGeometry.faces.forEach(({ a, b, c, normal, color }) => {
                if (isNormal.up(normal)) {
                    // Top
                    // Mutate geometry
                    const vertices = [a, b, c].map(v => groundGeometry.vertices[v]);
                    let faceZ = 0;
                    let faceFromCorner = 0;
                    vertices.forEach(vertex => {
                        vertex.z = Math.min(0, vertex.z + (Math.random() - .5) * .05);
                    });
                }
            });
            groundGeometry.colorsNeedUpdate = true;
            groundGeometry.verticesNeedUpdate = true;
            groundGeometry.normalsNeedUpdate = true;
            groundGeometry.computeFaceNormals();
            groundGeometry.computeVertexNormals();
        };
        /*this.on('firstrender', () => {
            document.querySelector('canvas').addEventListener('click', randomizeGround);
        });*/

        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = Math.PI / 2;
        this.scene.add(this.ground);

        // TODO: this.snow
    }
    createLights() {
        const ambientLight = new THREE.AmbientLight(0x555555);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, .1);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        const sunLight = new THREE.PointLight(0x404a3a, 5, 3000, .00025);
        sunLight.castShadow = true;
        this.on('firstrender', () => {
            // Set position of light once sun mesh is positioned
            sunLight.position.set(
                this.sun.position.x,
                this.sun.position.y,
                this.sun.position.z,
            );
        })
        this.scene.add(sunLight);
    }
    createParticles() {		
        const spread = 5;
        const amount = 5;

        const geometry = new THREE.Geometry();
        const material = new THREE.PointsMaterial();

        for (let i = 0; i < amount; i++) {
            const point = new THREE.Points(geometry, material);
            const x = THREE.Math.randFloatSpread(spread);
            const y = THREE.Math.randFloatSpread(spread) + 2;
            const z = THREE.Math.randFloatSpread(spread);
            point.position.set(x, y, z);
            point.scale.x = point.scale.y = 1;
            geometry.vertices.push(point);
        }
        this.precipitation = geometry;
        this.scene.add(geometry);
    }
    createCamera({ width, height }) {
        const aspect = width / height;
        const camera = new THREE.PerspectiveCamera(this.fov, width / height, 0.1, 1000);
        this.camera = camera;
        camera.lookAt(this.ground.position);

        const controls = new THREE.OrbitControls(this.camera);
        this.controls = controls;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.075;
        controls.rotateSpeed = 0.25;
        controls.enableDamping = true;
        controls.dampingFactor = 0.35;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.minPolarAngle = controls.maxPolarAngle = Math.PI * .375;

        this.updateDistanceDependencies = () => {
            const optimalAspect = 812 / 375; // 2.16533
            const defaultDistance = 13;
            const maxDistance = 22;
            const distanceMultiplier = optimalAspect / camera.aspect;

            const distance = Math.min(defaultDistance * distanceMultiplier, maxDistance);
        
            camera.position.set(
                1.25 * distance,
                .5 * distance,
                1 * distance
            );

            const defaultFog = 0.05;
            const minFog = 0.03;
            const fogMultiplier = camera.aspect / optimalAspect;
            this.fogDensity = Math.max(defaultFog * fogMultiplier, minFog);
            console.log('fog density set to', this.fogDensity);
        };
        this.updateDistanceDependencies();

        controls.update();
    }
    createRenderer({ width, height }) {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        this.renderer.setSize(width, height);
        
        this._redraw = this.redraw.bind(this);
        requestAnimationFrame(this._redraw);;
    }
    createPostProcessing({ width, height }) {
        this.composer = new THREE.EffectComposer(this.renderer);
        const composer = this.composer;
        
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        composer.addPass(renderPass);
        
        // Film grain
        const filmGrain = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: 0 },
            },
            vertexShader: document.getElementById('filmGrainVertexShader').textContent,
            fragmentShader: document.getElementById('filmGrainFragmentShader').textContent,
        });
        this.filmGrain = filmGrain;
        filmGrain.renderToScreen = true;
        
        // Bokeh
        /*const postprocessing = {};
        this.postprocessing = postprocessing;
        postprocessing.scene = new THREE.Scene();

        postprocessing.camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, - 10000, 10000 );
        postprocessing.camera.position.z = 100;

        postprocessing.scene.add( postprocessing.camera );

        var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
        postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( width, height, pars );
        postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( width, height.innerHeight, pars );

        var bokeh_shader = THREE.BokehShader;

        postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );

        postprocessing.bokeh_uniforms[ 'tColor' ].value = postprocessing.rtTextureColor.texture;
        postprocessing.bokeh_uniforms[ 'tDepth' ].value = postprocessing.rtTextureDepth.texture;
        postprocessing.bokeh_uniforms[ 'textureWidth' ].value = window.innerWidth;
        postprocessing.bokeh_uniforms[ 'textureHeight' ].value = window.innerHeight;
        var shaderSettings = {
            rings: 3,
            samples: 4
        };
        postprocessing.materialBokeh = new THREE.ShaderMaterial( {
            uniforms: postprocessing.bokeh_uniforms,
            vertexShader: bokeh_shader.vertexShader,
            fragmentShader: bokeh_shader.fragmentShader,
            defines: {
                RINGS: shaderSettings.rings,
                SAMPLES: shaderSettings.samples
            }
        } );

        postprocessing.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( width, height ), postprocessing.materialBokeh );
        postprocessing.quad.position.z = - 500;
        postprocessing.scene.add( postprocessing.quad );*/
    }
    
    resize() {
        const { width, height } = Game.getViewportDimensions();
        
        this.camera.aspect = width / height;
        this.updateDistanceDependencies();
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    } 
    redraw(now) {
        if (!this.hasRendered) {
            this.hasRendered = true;
            this.emit('firstrender');
        }
        
        this.controls.update();
        
        //this.filmGrain.uniforms.amount.value = now;
        this.scene.fog.density = this.fogDensity + (Math.sin(now / 2500) - .5) * 0.005;
        
        this.renderer.render(this.scene, this.camera);
        //this.composer.render();
        
        requestAnimationFrame(this._redraw);
    }
    
    on(name, callback = () => {}) {
        const listeners = this.listeners[name];
        if (!listeners) {
            this.listeners[name] = [callback];
        } else {
            listeners.push(callback);
        }
    }
    off(name, callback) {
        const listeners = this.listeners[name];
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    emit(name, payload) {
        const listeners = this.listeners[name];
        if (listeners) {
            listeners.forEach(listener => listener(payload));
        }
    }
    
    static getViewportDimensions() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }
}

class Music {
    constructor(url, container = document.body) {
        this.audio = new Audio(url);
        this.audio.ontimeupdate = this.tick.bind(this);
        this.audio.loop = true;

        this.firstPlay = true;

        this.container = container;
    }
    play() {
        if (this.firstPlay) {
            this.firstPlay = false;
            this.addButton();
        }
        this.button.style.opacity = '';
        this.audio.play();
    }
    pause() {
        this.audio.pause();
    }
    addButton() {
        const button = document.createElement('div');
        this.button = button;
        button.classList.add('button', 'music');
        button.style.opacity = 0;
        setTimeout(() => {
            button.style.opacity = '';
        }, 0);
        button.addEventListener('click', () => {
            if (this.playing) {
                this.pause();
            } else {
                this.play();
            }
        });
        this.container.appendChild(button);

        this.audio.addEventListener('play', () => {
            button.classList.add('playing');
        });
        this.audio.addEventListener('pause', () => {
            button.classList.remove('playing');
        });
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

const game = new Game();
const music = new Music('./20182013_1.mp3');
const welcome = new Welcome(document.getElementById('welcome'), [
    { text: 'Happy birthday' },
    { text: 'Ingrid', className: 'hearts' }
]);


}