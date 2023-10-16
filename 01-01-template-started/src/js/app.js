import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function () {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
  });

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

  // Scene: 물체, 카메라, 빛이 놓일 곳
  const scene = new THREE.Scene();
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

  const draw = () => {
    // 매 프레임마다 update
    controls.update();
    renderer.render(scene, camera);
    // 매 프레임마다 실행
    requestAnimationFrame(() => {
      draw();
    });
  };

  // 물체 생성
  const createObject = () => {
    // 재질
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });
    // 형태
    const geometry = new THREE.PlaneGeometry(1, 1);

    // 렌더링 가능한 3D 물체를 만드는 역할
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
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
    createObject();
    addEvent();
    draw();
  };
  initialize();
}
