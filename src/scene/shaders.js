// GLSL-шейдери блискавок. Колір задаємо в sRGB і переводимо в лінійний простір.

export const boltVertex = /* glsl */ `
  attribute float aSide;
  attribute float aAlong;
  varying float vSide;
  varying float vAlong;
  varying float vWorldY;
  void main() {
    vSide = aSide;
    vAlong = aAlong;
    vWorldY = (modelMatrix * vec4(position, 1.0)).y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const boltFragment = /* glsl */ `
  uniform float uAlpha;
  uniform float uReveal;
  uniform float uCloudTop;
  varying float vSide;
  varying float vAlong;
  varying float vWorldY;
  void main() {
    if (vAlong > uReveal) discard;
    float v = abs(vSide);
    float core = smoothstep(0.2, 0.0, v);
    float glow = exp(-v * v * 5.0) * 0.5;
    vec3 col = mix(vec3(0.42, 0.42, 1.0), vec3(1.0), core);
    float tip = 1.0 - smoothstep(0.8, 1.0, vAlong) * 0.6;
    float a = (core + glow) * uAlpha * tip;
    // Усередині хмари розряд видно як приглушене світіння
    a *= mix(0.18, 1.0, smoothstep(uCloudTop - 2.2, uCloudTop + 0.3, vWorldY));
    if (a < 0.01) discard;
    gl_FragColor = vec4(pow(col, vec3(2.2)) * a * 2.5, 1.0);
    #include <colorspace_fragment>
  }
`;
