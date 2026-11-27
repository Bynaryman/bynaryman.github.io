// Differences between neighboring pixels reveal mask boundaries at a fixed
// screen-space cost. Work on the displayed colors, including glass and ocean.
import { WebGLRenderTarget, Scene, PlaneGeometry, Mesh, ShaderMaterial, Vector2 } from "./lib/graphics.js";

export class PreviewEffect {
  constructor() {
    this.target = new WebGLRenderTarget(1, 1, { depthBuffer: false });
    this.scene = new Scene();
    this.material = new ShaderMaterial({
      uniforms: { frame: { value: this.target.texture }, stepUV: { value: new Vector2() }, blueprint: { value: false } },
      vertexShader: "varying vec2 coord; void main(){coord=uv;gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader: `
        varying vec2 coord; uniform sampler2D frame; uniform vec2 stepUV; uniform bool blueprint;
        void main(){
          vec3 c=texture2D(frame,coord).rgb;
          vec3 dx=texture2D(frame,coord+vec2(stepUV.x,0.)).rgb-texture2D(frame,coord-vec2(stepUV.x,0.)).rgb;
          vec3 dy=texture2D(frame,coord+vec2(0.,stepUV.y)).rgb-texture2D(frame,coord-vec2(0.,stepUV.y)).rgb;
          vec3 d=max(abs(dx),abs(dy)); float edge=smoothstep(0.045,0.38,max(d.r,max(d.g,d.b)));
          float light=dot(c,vec3(0.2126,0.7152,0.0722));
          vec3 base=vec3(0.025,0.085,0.16)+light*vec3(0.04,0.09,0.13);
          gl_FragColor=vec4(blueprint?mix(base,vec3(0.48,0.93,1.),edge):c*(1.-0.85*edge),1.);
        }`,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const quad = new Mesh(new PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }
  draw(renderer, camera, effect) {
    const { width, height } = renderer.domElement;
    if (!width || !height) return;
    this.target.setSize(width, height);
    renderer.initRenderTarget(this.target);
    renderer.copyFramebufferToTexture(this.target.texture);
    this.material.uniforms.stepUV.value.set(1 / width, 1 / height);
    this.material.uniforms.blueprint.value = effect === "blueprint";
    renderer.render(this.scene, camera);
  }
}
