// Об'ємні хмари: промінь із камери проходить крізь шар хмар, збирає густину
// і світло від блискавок. Композититься поверх відрендереної сцени з урахуванням глибини.

export const cloudVertex = /* glsl */ `
  out vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const cloudFragment = /* glsl */ `
  precision highp float;
  precision highp sampler3D;

  uniform sampler2D tScene;
  uniform sampler2D tDepth;
  uniform sampler3D uNoise;
  uniform mat4 uInvProj;
  uniform mat4 uCamWorld;
  uniform vec3 uCamPos;
  uniform float uTime;
  uniform float uStorm;
  uniform float uFlash;
  uniform vec3 uFlashPos;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uClear;      // 0 – хмари скрізь, 1 – розступаються навколо логотипа
  uniform vec3 uClearPos;
  uniform vec2 uRes;

  in vec2 vUv;
  out vec4 fragColor;

  #include <packing>

  const float Y_TOP = 1.1;
  const float Y_BOTTOM = -5.5;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float density(vec3 p, float detail) {
    float h = (p.y - Y_BOTTOM) / (Y_TOP - Y_BOTTOM);   // 0 внизу, 1 угорі
    vec3 wind = vec3(uTime * 0.045, uTime * 0.006, uTime * 0.02) * (0.6 + uStorm);

    vec4 n = texture(uNoise, p * 0.055 + wind);
    float shape = n.r * 0.65 + n.g * 0.35;

    // Купчасті вершини: верх хмар рваний, низ щільний і темний
    float top = 1.0 - smoothstep(0.5, 1.0, h + (shape - 0.5) * 1.3);
    float bottom = smoothstep(0.0, 0.25, h);
    // Що глибше, то суцільніша хмара: наскрізних дірок у шарі немає
    float coverage = mix(0.42, 0.33, uStorm) - (1.0 - h) * 0.35;
    float d = smoothstep(coverage, coverage + 0.26, shape) * top * bottom;

    if (detail > 0.5 && d > 0.01) {
      vec4 n2 = texture(uNoise, p * 0.23 + wind * 2.0);
      d -= (1.0 - n2.b) * 0.22 * (1.0 - d);
    }

    // Просвіт навколо логотипа, щоб він вийшов із хмар
    float clear = exp(-length((p - uClearPos) * vec3(0.32, 0.55, 0.32)));
    d *= 1.0 - uClear * clear * 1.4;
    return clamp(d, 0.0, 1.0) * mix(2.2, 3.2, uStorm);
  }

  // Скільки світла від блискавки доходить до точки крізь хмару
  float lightMarch(vec3 p, vec3 L) {
    vec3 dir = L - p;
    float dist = length(dir);
    dir /= dist;
    float step = min(dist, 2.2) / float(LIGHT_STEPS);
    float acc = 0.0;
    for (int i = 1; i <= LIGHT_STEPS; i++) acc += density(p + dir * step * float(i), 0.0);
    return exp(-acc * step * 0.9);
  }

  void main() {
    vec2 ndc = vUv * 2.0 - 1.0;
    vec4 clip = uInvProj * vec4(ndc, 1.0, 1.0);
    vec3 dirView = normalize(clip.xyz / clip.w);
    vec3 rd = normalize((uCamWorld * vec4(dirView, 0.0)).xyz);
    vec3 ro = uCamPos;

    // Відстань до геометрії сцени (логотип, блискавки), щоб хмари її закривали правильно
    float depth = texture(tDepth, vUv).x;
    float viewZ = perspectiveDepthToViewZ(depth, uCameraNear, uCameraFar);
    float sceneDist = depth >= 1.0 ? 1e5 : -viewZ / dirView.z;

    vec3 scene = texture(tScene, vUv).rgb;

    // Небо позаду: темне, догори синьо-фіолетове, знизу чорне
    if (depth >= 1.0) {
      float up = clamp(rd.y * 1.6 + 0.35, 0.0, 1.0);
      scene = mix(vec3(0.004, 0.005, 0.012), vec3(0.05, 0.05, 0.14), up);
      scene += vec3(0.33, 0.36, 0.9) * uFlash * 0.08 * (1.0 - up);
    }

    // Перетин променя з шаром хмар
    float t0 = (Y_TOP - ro.y) / rd.y;
    float t1 = (Y_BOTTOM - ro.y) / rd.y;
    float tn = min(t0, t1);
    float tf = max(t0, t1);
    if (ro.y < Y_TOP && ro.y > Y_BOTTOM) tn = 0.0;
    tn = max(tn, 0.0);
    tf = min(tf, min(sceneDist, 60.0));

    vec3 col = vec3(0.0);
    float T = 1.0;

    if (tf > tn && abs(rd.y) > 0.001) {
      float len = tf - tn;
      float stepLen = len / float(STEPS);
      float jitter = hash12(gl_FragCoord.xy + fract(uTime * 7.0) * 100.0);
      float t = tn + stepLen * jitter;

      vec3 skyCol = vec3(0.5, 0.54, 0.95);
      vec3 ambientTop = vec3(0.1, 0.1, 0.26);
      vec3 ambientBottom = vec3(0.01, 0.008, 0.03);
      vec3 flashCol = vec3(0.5, 0.56, 1.0);
      vec3 up = vec3(0.0, 1.0, 0.0);

      for (int i = 0; i < STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = density(p, 1.0);
        if (d > 0.002) {
          float h = clamp((p.y - Y_BOTTOM) / (Y_TOP - Y_BOTTOM), 0.0, 1.0);
          // Верхівки хмар світліші, у глибині темно
          vec3 amb = mix(ambientBottom, ambientTop, h * h) * (1.0 - 0.5 * uStorm);

          // Світло неба зверху із самозатіненням: виділяє купчасті вершини
          float skyShadow = exp(-(density(p + up * 0.5, 0.0) + density(p + up * 1.2, 0.0)) * 0.9);
          vec3 lit = amb + skyCol * skyShadow * h * (0.38 - 0.22 * uStorm);
          if (uFlash > 0.01) {
            float dl = length(p - uFlashPos);
            float att = 9.0 / (1.0 + dl * dl * 0.35);
            float shadow = lightMarch(p, uFlashPos);
            lit += flashCol * uFlash * att * shadow;
          }

          // Розсіювання: тонкі краї пропускають більше світла
          float powder = 1.0 - exp(-d * 2.0);
          vec3 s = lit * powder;
          float a = 1.0 - exp(-d * stepLen);
          col += T * s * a;
          T *= 1.0 - a;
          if (T < 0.02) break;
        }
        t += stepLen;
      }
    }

    vec3 result = scene * T + col;
    // Дизеринг проти смуг у темних градієнтах
    result += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
    fragColor = vec4(result, 1.0);
  }
`;
