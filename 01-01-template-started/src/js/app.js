import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { convertLatLngToPos, getGradientCanvas } from "./utils";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import dat from "dat.gui";
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";

export default function () {
  const canvasSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const clock = new THREE.Clock();

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
  });
  // renderer.outputEncoding = THREE.sRGBEncoding;
  const renderTarget = new THREE.WebGLRenderTarget(
    canvasSize.width,
    canvasSize.height,
    {
      samples: 2,
    }
  );

  const effectComposer = new EffectComposer(renderer, renderTarget);

  const textureLoader = new THREE.TextureLoader();
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const environmentMap = cubeTextureLoader.load([
    "assets/environments/px.png",
    "assets/environments/nx.png",
    "assets/environments/py.png",
    "assets/environments/ny.png",
    "assets/environments/pz.png",
    "assets/environments/nz.png",
  ]);

  environmentMap.encoding = THREE.sRGBEncoding;

  const container = document.querySelector("#container");
  // renderer.domElement에는 canvas element 정보가 담겨있음
  container.appendChild(renderer.domElement);

  renderer.setSize(canvasSize.width, canvasSize.height);
  // 현재 디바이스 픽셀의 비율에 맞는 픽셀 값을 renderer에 넘겨준다
  // 최소 (현재 디스플레이 디바이스의 픽셀 밀도), 최대 허용 배수 (2배)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Scene: 물체, 카메라, 빛이 놓일 곳
  const scene = new THREE.Scene();
  scene.background = environmentMap; // 씬의 배경 설정
  scene.environment = environmentMap; // 3D 객체에 반사 및 환경조명 제공

  // PerspectiveCamera: 원근법 3D장면을 2D 카메라에 투영하는 카메라
  const camera = new THREE.PerspectiveCamera(
    75, // field of view (시야각) - 75가 보통 사용되는 값. 값이 클수록 넓어짐
    canvasSize.width / canvasSize.height, // aspect ratio: 카메라 종횡비 값 (찌그러지지 않게)
    0.1, // near: scene으로부터 카메라와 가장 가까운 지점까지의 거리 (이 거리보다 가까워지면 물체가 안보임)
    100 // far: scene ~ 카메라와 가장 먼 지점의 거리 (이 거리보다 멀어지면 물체가 안보임)
  );

  camera.position.set(0, 0, 3);

  const controls = new OrbitControls(camera, renderer.domElement);
  // 회전시키다 멈췄을 때 부드럽게 멈추는 효과
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  const gui = new dat.GUI();

  const addLight = () => {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(2.65, 2.13, 1.02);
    scene.add(light);
  };

  const addPostEffects = (obj) => {
    const { earthGroup } = obj;
    const renderPass = new RenderPass(scene, camera);
    effectComposer.addPass(renderPass);

    // 필름 효과
    const filmPass = new FilmPass(
      1, // noise intensity 0 ~ 1 범위
      1, // scan line intensity 0 ~ 1 브라운관 tv 느낌
      2000, // scan line count 라인 갯수 0 ~ 4096
      false // 색상 값 gray scale
    );
    effectComposer.addPass(filmPass);

    // 밝기
    const unrealBloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvasSize.width, canvasSize.height)
    );
    unrealBloomPass.strength = 0.4; // 밝기
    unrealBloomPass.threshold = 0.2; // 빛나는 영역
    unrealBloomPass.radius = 0.7; // 빛이 번지는 정도 (부드럽게 빛이 넘어가는 느낌)
    effectComposer.addPass(unrealBloomPass);

    // 부드러운 화면을 보여주기 위해
    const smaaPass = new SMAAPass();
    effectComposer.addPass(smaaPass);

    const shaderPass = new ShaderPass(GammaCorrectionShader);
    effectComposer.addPass(shaderPass);

    const customShaderPass = new ShaderPass({
      uniforms: {
        uBrightness: { value: 0.6 },
        uPosition: { value: new THREE.Vector2(0, 0) },
        uColor: { value: new THREE.Vector3(0, 0, 2.0) },
        uAlpha: { value: 0.5 },
        tDiffuse: { value: null }, // 포스트 프로세싱에서 정의되어있는 변수 이름 -> 값을 초기화해준다
        // 포스트 프로세싱 파이프라인에 따라 렌더링하던 지구, 별 등을 하나의 텍스쳐 이미지로서 tDiffuse에 저장됨
        // 이 데이터를 fragmentShader로 넘겨 픽셀의 색상값을 사용할 수 있도록 한다
      },
      vertexShader,
      fragmentShader,
    });

    gui.add(customShaderPass.uniforms.uPosition.value, "x", -1, 1, 0.01);
    gui.add(customShaderPass.uniforms.uPosition.value, "y", -1, 1, 0.01);
    gui
      .add(customShaderPass.uniforms.uBrightness, "value", 0, 2, 0.1)
      .name("brightness");

    effectComposer.addPass(customShaderPass);
  };

  // 물체 생성
  const createEarth1 = () => {
    const material = new THREE.MeshStandardMaterial({
      map: textureLoader.load("assets/earth-night-map.jpeg"),
      // 질감 표현
      // roughness: 0,
      // metalness: 0,
      side: THREE.FrontSide,
      opacity: 0.6,
      transparent: true,
    });
    const geometry = new THREE.SphereGeometry(1.3, 30, 30);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = -Math.PI / 2;
    return mesh;
  };

  const createEarth2 = () => {
    const material = new THREE.MeshStandardMaterial({
      map: textureLoader.load("assets/earth-night-map.jpeg"),
      opacity: 0.9,
      transparent: true, // opacity를 주려면 설정 필수
      side: THREE.BackSide, // 뒷면만 로드한다
    });
    const geometry = new THREE.SphereGeometry(1.5, 30, 30);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = -Math.PI / 2;
    return mesh;
  };

  const createStar = (count = 500) => {
    // 일반 배열이 아닌 정확한 데이터 자료를 넘겨줘야한다
    const positions = new Float32Array(count * 3);
    // 배열의 크기는 count * 3 -> x,y,z 세 개의 값으로 하나의 별의 위치를 나타냄

    // 파티클의 위치를 무작위로 할당한다
    for (let i = 0; i < count; i++) {
      positions[i] = (Math.random() - 0.5) * 5; // x: 0~3 -> -3과 3 사이의 랜덤값
      positions[i + 1] = (Math.random() - 0.5) * 5;
      positions[i + 2] = (Math.random() - 0.5) * 5;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.01,
      transparent: true,
      depthWrite: false,
      map: textureLoader.load("assets/particle.png"),
      alphaMap: textureLoader.load("assets/particle.png"),
      color: 0xbcc6c6,
    });

    const star = new THREE.Points(particleGeometry, particleMaterial);
    return star;
  };

  const createPoint1 = () => {
    const point = {
      lat: 37.56668 * (Math.PI / 180), // 라디안 단위로 바꿔준다
      lng: 126.97841 * (Math.PI / 180),
    };

    const position = convertLatLngToPos(point, 1.3);

    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.002, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0x263d74, transparent: true })
    );

    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.set(0.9, 2.46, 1);
    return mesh;
  };

  const createPoint2 = () => {
    const point = {
      lat: 5.55363 * (Math.PI / 180), // 라디안 단위로 바꿔준다
      lng: -0.196481 * (Math.PI / 180),
    };

    const position = convertLatLngToPos(point, 1.3);

    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.002, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0x263d74, transparent: true })
    );

    mesh.position.set(position.x, position.y, position.z);
    return mesh;
  };

  const createCurve = (pos1, pos2) => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const pos = new THREE.Vector3().lerpVectors(pos1, pos2, i / 100);
      pos.normalize(); // 1 미만으로 정규화

      const wave = Math.sin((Math.PI * i) / 100);

      pos.multiplyScalar(1.3 + 0.4 * wave); // 지구 반지름 크기 + 파동
      points.push(pos);
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 20, 0.003);

    const gradientCanvas = getGradientCanvas("#757F94", "#263d74");
    const texture = new THREE.CanvasTexture(gradientCanvas);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    // three.js에선 gradient 생성 방법이 따로 없음: canvas 활용
    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
  };

  const create = () => {
    const earthGroup = new THREE.Group();

    const earth1 = createEarth1();
    const earth2 = createEarth2();
    const star = createStar();
    const point1 = createPoint1();
    const point2 = createPoint2();
    const curve = createCurve(point1.position, point2.position);

    earthGroup.add(earth1, earth2, point1, point2, curve);
    scene.add(earthGroup, star);

    return {
      earthGroup,
      star,
      curve,
      point1,
      point2,
    };
  };

  const resize = () => {
    canvasSize.width = window.innerWidth;
    canvasSize.height = window.innerHeight;

    camera.aspect = canvasSize.width / canvasSize.height;
    camera.updateProjectionMatrix();

    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    effectComposer.setSize(canvasSize.width, canvasSize.height);
  };

  const addEvent = () => {
    window.addEventListener("resize", resize);
  };

  const draw = (obj) => {
    const { earthGroup, star, curve, point1, point2 } = obj;
    earthGroup.rotation.x += 0.0005;
    earthGroup.rotation.y += 0.0005;

    star.rotation.x += 0.001;
    star.rotation.y += 0.001;

    // 매 프레임마다 update
    controls.update();
    effectComposer.render();

    const timeElapsed = clock.getElapsedTime();

    let drawRangeCount = curve.geometry.drawRange.count;
    const progress = timeElapsed / 2.5;
    const speed = 3;
    drawRangeCount = progress * speed * 960;

    curve.geometry.setDrawRange(0, drawRangeCount);

    if (timeElapsed > 4) {
      point1.material.opacity = 5 - timeElapsed;
      point2.material.opacity = 5 - timeElapsed;
      curve.material.opacity = 5 - timeElapsed;
    }

    // renderer.render(scene, camera); // --> addPostEffects에 위임한다
    // 매 프레임마다 실행
    requestAnimationFrame(() => {
      draw(obj);
    });
  };

  const initialize = () => {
    const obj = create();

    addLight();
    addPostEffects(obj);
    addEvent();
    draw(obj);
  };
  initialize();
}
