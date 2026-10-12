import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';

// Домальовує блискавки поверх хмар адитивно, без глибини:
// так розряд не «прорізає» хмару, а світиться крізь неї
export class BoltPass extends Pass {
  constructor(scene, camera) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.needsSwap = false;
  }

  render(renderer, writeBuffer, readBuffer) {
    if (!this.scene.children.length) return;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    renderer.render(this.scene, this.camera);
    renderer.autoClear = autoClear;
  }
}
