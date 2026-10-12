// GLSL-шейдери сцени. Кольори задаємо в sRGB і переводимо в лінійний простір
// перед виводом, щоб із bloom і без нього картинка виглядала однаково.

const noise = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < OCTAVES; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
    return v;
  }
`;

export const skyVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const skyFragment = /* glsl */ `
  uniform float uTime;
  uniform float uStorm;
  uniform float uFlash;
  uniform vec2 uFlashPos;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  varying vec2 vUv;
  ${noise}

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    p += uMouse * 0.03;
    float t = uTime * mix(0.02, 0.05, uStorm);

    vec2 q = vec2(fbm(p * 1.4 + vec2(t, 0.0)), fbm(p * 1.4 + vec2(5.2, 1.3 - t)));
    float c = fbm(p * 2.0 + q * 1.7 + vec2(t * 1.5, -t));

    // Хмари щільніші вгорі, з наростанням шторму стають важчими
    float top = smoothstep(-0.7, 0.55, p.y);
    float dens = smoothstep(0.38, 0.95, c) * (0.35 + 0.65 * top) * mix(0.55, 1.0, uStorm);

    vec3 base = mix(vec3(0.012, 0.014, 0.03), vec3(0.03, 0.03, 0.075), vUv.y);
    vec3 cloud = mix(vec3(0.07, 0.08, 0.2), vec3(0.24, 0.17, 0.46), c);
    vec3 col = base + cloud * dens;

    // Підсвітка хмар від блискавки
    float fd = length(p - uFlashPos);
    float lit = uFlash * (exp(-fd * 1.6) * 1.3 + 0.12);
    col += vec3(0.42, 0.48, 1.0) * lit * (dens * 1.6 + 0.08);

    // Віньєтка і дизеринг проти смуг у градієнтах
    col *= 1.0 - 0.6 * dot(vUv - 0.5, vUv - 0.5) * 2.0;
    col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;

    gl_FragColor = vec4(pow(max(col, 0.0), vec3(2.2)), 1.0);
    #include <colorspace_fragment>
  }
`;

export const particleVertex = /* glsl */ `
  attribute vec3 aStorm;   // радіус, кут, висота у вихорі
  attribute vec4 aLogo;    // xyz – точка логотипа, w – 1 для логотипа, 0 для пилу
  attribute vec4 aRandom;

  uniform float uTime;
  uniform float uSpin;
  uniform float uForm;
  uniform float uBurst;
  uniform float uFlash;
  uniform float uShock;
  uniform float uStormScale;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uMouse;
  uniform vec3 uStormCenter;

  varying vec3 vColor;
  varying float vAlpha;

  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

  void main() {
    // Вихор: диференційне обертання, внутрішні шари крутяться швидше
    float r = aStorm.x;
    float th = aStorm.y + uSpin * (1.2 / (0.35 + r * 0.45));
    vec3 sp = vec3(cos(th) * r, aStorm.z * (0.25 + 0.12 * r), sin(th) * r);
    sp += 0.12 * vec3(
      sin(uTime * 0.7 + aRandom.y * 6.283 + r),
      cos(uTime * 0.9 + aRandom.z * 6.283),
      sin(uTime * 0.6 + aRandom.w * 6.283));
    sp = rotX(-1.05) * sp * uStormScale + uStormCenter;

    // Перехід шторм → логотип з індивідуальною затримкою і дугою
    float delay = aRandom.x * 0.35;
    float f = smoothstep(delay, delay + 0.65, uForm);
    vec3 lp = aLogo.xyz;
    lp += 0.015 * vec3(sin(uTime * 2.0 + aRandom.y * 40.0), cos(uTime * 1.7 + aRandom.z * 40.0), 0.0);
    vec3 pos = mix(sp, lp, f);
    vec3 travel = lp - sp;
    pos += sin(f * 3.14159) * normalize(vec3(-travel.y, travel.x, 0.0) + 0.001) * (0.6 + 1.6 * aRandom.y);

    // Вибух логотипа в простір
    float b = smoothstep(aRandom.z * 0.3, aRandom.z * 0.3 + 0.7, uBurst);
    vec3 dir = normalize(lp * vec3(1.0, 1.4, 1.0) + vec3(0.0, 0.0, 3.0) + (aRandom.yzw - 0.5) * 2.0);
    pos += dir * b * (4.0 + aRandom.w * 16.0);

    // Частинки розступаються від курсора
    vec2 md = pos.xy - uMouse.xy;
    float m = exp(-dot(md, md) * 0.9) * uMouse.z;
    pos.xy += normalize(md + 0.0001) * m * mix(0.9, 0.22, f);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float isLogo = aLogo.w;
    float size = mix(0.6 + aRandom.w * 1.4, mix(0.9 + aRandom.w * 1.6, 0.55 + aRandom.w * 0.5, isLogo), f);
    gl_PointSize = uSize * size * uPixelRatio * (12.0 / -mv.z) * (1.0 + uFlash * 0.4);

    vec3 blue = vec3(0.22, 0.42, 1.0);
    vec3 violet = vec3(0.58, 0.36, 1.0);
    vec3 hot = vec3(0.82, 0.9, 1.0);
    vec3 col = mix(blue, violet, aRandom.y);
    col = mix(col, hot, step(0.94, aRandom.z));
    col = mix(col, mix(hot, blue, 0.35 + 0.3 * aRandom.y), f * isLogo * 0.75);

    // Ударна хвиля від великої блискавки
    float ring = exp(-pow(length(lp.xy) - uShock * 9.0, 2.0) * 1.5) * (1.0 - uShock);
    col += hot * ring * f * 1.5;
    col *= 1.0 + uFlash * 1.2;

    float alpha = mix(0.5, mix(0.25, 0.95, isLogo), f);
    alpha *= 1.0 - b * 0.85;
    vColor = col;
    vAlpha = alpha;
  }
`;

export const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    if (a < 0.01) discard;
    gl_FragColor = vec4(pow(vColor, vec3(2.2)) * a * vAlpha, 1.0);
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

export const boltFragment = /* glsl */ `
  uniform float uAlpha;
  uniform float uReveal;
  varying float vSide;
  varying float vAlong;
  void main() {
    if (vAlong > uReveal) discard;
    float v = abs(vSide);
    float core = smoothstep(0.2, 0.0, v);
    float glow = exp(-v * v * 5.0) * 0.5;
    vec3 col = mix(vec3(0.42, 0.42, 1.0), vec3(1.0), core);
    float tip = 1.0 - smoothstep(0.8, 1.0, vAlong) * 0.6;
    float a = (core + glow) * uAlpha * tip;
    gl_FragColor = vec4(pow(col, vec3(2.2)) * a, 1.0);
    #include <colorspace_fragment>
  }
`;
