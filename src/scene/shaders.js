// GLSL-шейдери: студійне тло, дзеркальна підлога і електричні розряди.

export const bgVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Чорне студійне тло: холодна пляма світла позаду логотипа, димка внизу, віньєтка
export const bgFragment = /* glsl */ `
  uniform float uTime;
  uniform float uFlash;
  uniform vec2 uRes;
  uniform vec2 uSpot;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.1 + 3.7; a *= 0.5; }
    return v;
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);

    vec3 col = vec3(0.012, 0.012, 0.018);

    // М'яка холодна пляма позаду логотипа
    vec2 sp = p - uSpot;
    float spot = exp(-dot(sp * vec2(1.0, 1.8), sp * vec2(1.0, 1.8)) * 2.2);
    col += vec3(0.075, 0.078, 0.1) * spot * (1.0 + uFlash * 2.5);

    // Повільна димка біля підлоги
    float haze = fbm(p * 2.5 + vec2(uTime * 0.02, 0.0)) * smoothstep(0.25, -0.45, p.y);
    col += vec3(0.035, 0.04, 0.06) * haze;

    col *= 1.0 - 0.75 * dot(p, p) * 0.9;
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

    gl_FragColor = vec4(pow(max(col, 0.0), vec3(2.2)), 1.0);
    #include <colorspace_fragment>
  }
`;

export const floorVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Чорна підлога, що ховає відбиття логотипа з віддаленням від лінії контакту
export const floorFragment = /* glsl */ `
  uniform float uFade;
  uniform float uOpacity;
  varying vec3 vWorld;
  void main() {
    float a = smoothstep(0.0, uFade, vWorld.z) * 0.85 + 0.15;
    gl_FragColor = vec4(vec3(0.0), a * uOpacity);
  }
`;

export const boltVertex = /* glsl */ `
  attribute float aSide;
  attribute float aAlong;
  varying float vSide;
  varying float vAlong;
  void main() {
    vSide = aSide;
    vAlong = aAlong;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Тонкий розряд: білий стрижень із ледь холодним ореолом
export const boltFragment = /* glsl */ `
  uniform float uAlpha;
  uniform float uReveal;
  varying float vSide;
  varying float vAlong;
  void main() {
    if (vAlong > uReveal) discard;
    float v = abs(vSide);
    float core = smoothstep(0.3, 0.0, v);
    float glow = exp(-v * v * 4.0) * 0.35;
    vec3 col = mix(vec3(0.7, 0.78, 1.0), vec3(1.0), core);
    float tip = 1.0 - smoothstep(0.75, 1.0, vAlong) * 0.7;
    float a = (core + glow) * uAlpha * tip;
    if (a < 0.01) discard;
    gl_FragColor = vec4(pow(col, vec3(2.2)) * a * 3.0, 1.0);
    #include <colorspace_fragment>
  }
`;
