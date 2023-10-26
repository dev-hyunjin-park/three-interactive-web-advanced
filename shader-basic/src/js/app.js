export default function () {
  // WEBGL 시작하기
  const container = document.querySelector("#container");
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 300;

  container.appendChild(canvas);

  // 캔버스(는 브릿지 역할)로 webgl을 사용하겠다
  const gl = canvas.getContext("webgl");

  // vertex shader
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(
    vertexShader,
    `
    attribute vec2 position; // glsl 언어 (open gl shader language)
    varying vec2 vPosition;

    // 셰이더 코드가 컴파일 되어 해석될 때 가장 먼저 호출되는 함수
    void main(){
        vec2 newPosition = (position + 1.0) / 2.0; // 0~1
        // 클립공간(3d 정점을 2d 뷰포트에 투영하기 위한 좌표공간)에서 정점 셰이더의 특수한 전역변수
        gl_Position = vec4(position, 0.0, 1.0);

        vPosition = newPosition;
    }
  `
  );
  gl.compileShader(vertexShader);

  // fragment shader
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(
    fragmentShader,
    `
  precision mediump float;
  varying vec2 vPosition;

  void main(){
    vec3 color = vec3(vPosition.x, vPosition.y, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
  `
  );
  gl.compileShader(fragmentShader);

  // vertex와 fragment 셰이더를 하나의 프로그램으로 연결해준다
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // 정점 데이터 넘겨주기
  const vertices = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // 정점의 위치를 어떻게 계산할지
  const position = gl.getAttribLocation(program, "position");
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(position);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
