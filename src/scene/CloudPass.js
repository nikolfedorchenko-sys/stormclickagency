import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { cloudVertex, cloudFragment } from './cloudShader.js';

// Прохід постобробки: малює об'ємні хмари поверх сцени з урахуванням її глибини
export class CloudPass extends Pass {
  constructor(camera, noise, { steps = 40, lightSteps = 3 } = {}) {
    super();
    this.camera = camera;
    this.uniforms = {
      tScene: { value: null },
      tDepth: { value: null },
      uNoise: { value: noise },
      uInvProj: { value: new THREE.Matrix4() },
      uCamWorld: { value: new THREE.Matrix4() },
      uCamPos: { value: new THREE.Vector3() },
      uTime: { value: 0 },
      uStorm: { value: 0 },
      uFlash: { value: 0 },
      uFlashPos: { value: new THREE.Vector3(0, 0, -4) },
      uCameraNear: { value: camera.near },
      uCameraFar: { value: camera.far },
      uClear: { value: 0 },
      uClearPos: { value: new THREE.Vector3() },
      uRes: { value: new THREE.Vector2() },
    };
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: cloudVertex,
      fragmentShader: cloudFragment,
      uniforms: this.uniforms,
      defines: { STEPS: steps, LIGHT_STEPS: lightSteps },
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.material);
    this.needsSwap = true;
  }

  render(renderer, writeBuffer, readBuffer) {
    const u = this.uniforms;
    u.tScene.value = readBuffer.texture;
    u.tDepth.value = readBuffer.depthTexture;
    u.uInvProj.value.copy(this.camera.projectionMatrixInverse);
    u.uCamWorld.value.copy(this.camera.matrixWorld);
    u.uCamPos.value.copy(this.camera.position);
    u.uCameraNear.value = this.camera.near;
    u.uCameraFar.value = this.camera.far;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }

  dispose() {
    this.material.dispose();
    this.quad.dispose();
  }
}
