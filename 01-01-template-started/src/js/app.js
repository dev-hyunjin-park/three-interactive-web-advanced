import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function () {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
  });

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

  const canvasSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

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

  const draw = (obj) => {
    const { earth1, earth2, star } = obj;
    earth1.rotation.x += 0.0005;
    earth1.rotation.y += 0.0005;

    earth2.rotation.x += 0.0005;
    earth2.rotation.y += 0.0005;

    star.rotation.x += 0.001;
    star.rotation.y += 0.001;

    // 매 프레임마다 update
    controls.update();
    renderer.render(scene, camera);
    // 매 프레임마다 실행
    requestAnimationFrame(() => {
      draw(obj);
    });
  };

  const addLight = () => {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(2.65, 2.13, 1.02);
    scene.add(light);
  };

  // 물체 생성
  const createEarth1 = () => {
    const material = new THREE.MeshStandardMaterial({
      map: textureLoader.load("assets/earth-night-map.jpeg"),
      // 질감 표현
      roughness: 0,
      metalness: 0,
      opacity: 0.6,
      transparent: true,
    });
    const geometry = new THREE.SphereGeometry(1.3, 30, 30);

    const mesh = new THREE.Mesh(geometry, material);
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

  const create = () => {
    const earth1 = createEarth1();
    const earth2 = createEarth2();
    const star = createStar();
    scene.add(earth1, earth2, star);

    return {
      earth1,
      earth2,
      star,
    };
  };

  const resize = () => {
    canvasSize.width = window.innerWidth;
    canvasSize.height = window.innerHeight;

    camera.aspect = canvasSize.width / canvasSize.height;
    camera.updateProjectionMatrix();

    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  const addEvent = () => {
    window.addEventListener("resize", resize);
  };

  const initialize = () => {
    addLight();
    const obj = create();
    addEvent();
    draw(obj);
  };
  initialize();
}
