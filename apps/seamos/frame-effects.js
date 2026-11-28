// Differences between neighboring pixels reveal mask boundaries at a fixed
// screen-space cost. Work on the displayed colors, including glass and ocean.
import { WebGLRenderTarget, Scene, PlaneGeometry, Mesh, ShaderMaterial, Vector2, Color, DoubleSide } from "./lib/graphics.js";

export class PreviewEffect {
  constructor() {
    this.target = new WebGLRenderTarget(1, 1, { depthBuffer: false });
    this.heightTarget = new WebGLRenderTarget(1, 1);
    this.clearColor = new Color();
    this.heightMaterial = new ShaderMaterial({
      side: DoubleSide,
      clipping: true,
      uniforms: { stackRange: { value: new Vector2() } },
      vertexShader: `#include <clipping_planes_pars_vertex>
varying float height; void main(){vec4 p=vec4(position,1.);
        #ifdef USE_INSTANCING
          p=instanceMatrix*p;
        #endif
        p=modelMatrix*p; height=p.y;vec4 mvPosition=viewMatrix*p; gl_Position=projectionMatrix*mvPosition;
#include <clipping_planes_vertex>
}`,
      fragmentShader: `#include <clipping_planes_pars_fragment>
varying float height;uniform vec2 stackRange;void main(){
#include <clipping_planes_fragment>
        gl_FragColor=vec4((1.+254.*clamp((height-stackRange.x)*stackRange.y,0.,1.))/255.,0.,0.,1.);
      }`,
    });
    this.scene = new Scene();
    this.material = new ShaderMaterial({
      uniforms: {
        frame: { value: this.target.texture },
        stepUV: { value: new Vector2() },
        style: { value: 0 },
        heights: { value: this.heightTarget.texture },
        scanning: { value: false },
        center: { value: 0 },
        band: { value: new Color() },
        trail: { value: new Color() },
      },
      vertexShader: "varying vec2 coord; void main(){coord=uv;gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader: `
        varying vec2 coord; uniform sampler2D frame; uniform vec2 stepUV; uniform int style; uniform bool scanning;
        uniform sampler2D heights; uniform float center; uniform vec3 band,trail;
        void main(){
          vec3 c=texture2D(frame,coord).rgb;
          vec3 dx=texture2D(frame,coord+vec2(stepUV.x,0.)).rgb-texture2D(frame,coord-vec2(stepUV.x,0.)).rgb;
          vec3 dy=texture2D(frame,coord+vec2(0.,stepUV.y)).rgb-texture2D(frame,coord-vec2(0.,stepUV.y)).rgb;
          vec3 d=max(abs(dx),abs(dy)); float edge=smoothstep(0.045,0.38,max(d.r,max(d.g,d.b)));
          float light=dot(c,vec3(0.2126,0.7152,0.0722));
          vec3 base=vec3(0.025,0.085,0.16)+light*vec3(0.04,0.09,0.13);
          vec3 rgb=style==2?mix(base,vec3(0.48,0.93,1.),edge):(style==1?c*(1.-0.85*edge):c);
          if(scanning) {
            float id=texelFetch(heights,ivec2(gl_FragCoord.xy),0).r*255.;
            if(id>0.5){
              float d=center-(id-1.)/254.;
              float core=max(0.,1.-abs(d)/0.09);
              float tail=max(0.,1.-abs(d-0.08)/0.15)*(1.-core);
              float a=core*0.84,b=tail*0.46;
              rgb=rgb*(1.-a-b)+band*a+trail*b;
            }
          }
          gl_FragColor=vec4(rgb,1.);
        }`,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const quad = new Mesh(new PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }
  capture(renderer, world, camera, scanEnabled, range, planes) {
    const { width, height } = renderer.domElement;
    if (!width || !height) return;
    this.target.setSize(width, height);
    renderer.initRenderTarget(this.target);
    renderer.copyFramebufferToTexture(this.target.texture);
    this.material.uniforms.stepUV.value.set(1 / width, 1 / height);
    if (!scanEnabled) return;
    this.heightTarget.setSize(width, height);
    const background = world.background,
      override = world.overrideMaterial,
      mask = camera.layers.mask;
    const alpha = renderer.getClearAlpha(),
      shadows = renderer.shadowMap.autoUpdate;
    renderer.getClearColor(this.clearColor);
    try {
      world.background = null;
      this.heightMaterial.clippingPlanes = planes;
      world.overrideMaterial = this.heightMaterial;
      this.heightMaterial.uniforms.stackRange.value.fromArray(range);
      renderer.shadowMap.autoUpdate = false;
      camera.layers.set(1);
      renderer.setRenderTarget(this.heightTarget);
      renderer.setClearColor(0, 0);
      renderer.render(world, camera);
    } finally {
      renderer.setRenderTarget(null);
      renderer.setClearColor(this.clearColor, alpha);
      renderer.shadowMap.autoUpdate = shadows;
      camera.layers.mask = mask;
      world.background = background;
      world.overrideMaterial = override;
    }
  }
  draw(renderer, camera, effect, scan, phase) {
    const u = this.material.uniforms;
    u.style.value = effect === "ink" ? 1 : effect === "blueprint" ? 2 : 0;
    u.scanning.value = scan.enabled;
    u.center.value = phase * 1.32 - 0.09;
    u.band.value.set(scan.band).convertLinearToSRGB();
    u.trail.value.set(scan.trail).convertLinearToSRGB();
    renderer.render(this.scene, camera);
  }
}
