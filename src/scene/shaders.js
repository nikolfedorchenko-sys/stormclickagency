// GLSL-шейдери: чорне тло з віньєткою і зерном, внутрішній розряд у склі.

export const bgVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const bgFragment = /* glsl */ `
  uniform float uTime;
  uniform float uGlow;
  uniform vec2 uRes;
  uniform vec2 uSpot;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);

    // Глибокий чорний із ледь теплішим центром, щоб кадр не був «мертвим»
    vec3 col = vec3(0.006, 0.006, 0.009);
    // Холодне сяйво позаду моноліта: саме його скло заломлює і показує свою товщу
    vec2 sp = p - uSpot;
    float spot = exp(-dot(sp * vec2(1.4, 1.0), sp * vec2(1.4, 1.0)) * 2.4);
    col += vec3(0.1, 0.11, 0.2) * spot * (1.0 + uGlow * 2.0);

    col *= 1.0 - 0.5 * dot(p, p);
    // Статичне зерно проти смуг у градієнті (рухоме мерехтить на телефонах)
    col += (hash(gl_FragCoord.xy) - 0.5) * 0.008;

    gl_FragColor = vec4(pow(max(col, 0.0), vec3(2.2)), 1.0);
    #include <colorspace_fragment>
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

// Розряд: білий стрижень із холодним ореолом. Крізь димчасте скло видно лише його світло
export const boltFragment = /* glsl */ `
  uniform float uAlpha;
  uniform float uReveal;
  uniform vec3 uColor;
  varying float vSide;
  varying float vAlong;
  void main() {
    if (vAlong > uReveal) discard;
    float v = abs(vSide);
    float core = smoothstep(0.35, 0.0, v);
    float glow = exp(-v * v * 3.0) * 0.5;
    vec3 col = mix(uColor, vec3(1.0), core * 0.9);
    float tip = 1.0 - smoothstep(0.75, 1.0, vAlong) * 0.6;
    float a = (core + glow) * uAlpha * tip;
    if (a < 0.01) discard;
    gl_FragColor = vec4(pow(col, vec3(2.2)) * a * 4.0, 1.0);
    #include <colorspace_fragment>
  }
`;
