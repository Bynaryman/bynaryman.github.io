import * as T from "./lib/graphics.js";
import { defaultWater, waterLevel } from "./bryce.js";

// Decode the same panorama for both renderers. Only send the CPU copy when
// a trace worker actually needs it.
export async function loadPanorama(sky) {
  const image = new Image();
  image.src = new URL("./assets/" + sky.file + ".webp", import.meta.url).href;
  await image.decode();
  // Bake the longitude into one panorama so environment lighting, sky, water
  // reflections and the worker's texture all use exactly the same orientation.
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  const offset = Math.round(sky.turn * canvas.width);
  ctx.drawImage(image, offset, 0);
  if (offset) ctx.drawImage(image, offset - canvas.width, 0);
  const small = document.createElement("canvas");
  small.width = Math.min(1536, canvas.width);
  small.height = small.width / 2;
  const sampler = small.getContext("2d");
  sampler.drawImage(canvas, 0, 0, small.width, small.height);
  return { image: canvas, pixels: sampler.getImageData(0, 0, small.width, small.height) };
}

const fragmentShader = `
uniform sampler2D panorama, mirrorImage;
uniform vec4 bands[4];
uniform float skyTurn,waveTime;
uniform vec3 waterTint;
uniform mat4 inverseProjection, cameraWorld, mirrorVP;
varying vec2 clipXY;
vec3 sky(vec3 d){
  vec2 uv=vec2(atan(d.z,d.x)*0.159154943+0.5+skyTurn,asin(clamp(d.y,-1.0,1.0))*0.318309886+0.5);
  return texture2D(panorama,uv).rgb;
}
void main(){
  vec4 eye=inverseProjection*vec4(clipXY,1.0,1.0);
  vec3 d=normalize(mat3(cameraWorld)*eye.xyz);
  vec3 origin=cameraWorld[3].xyz;
  vec3 color=sky(d);
  if(d.y < -0.000001 && origin.y > ${waterLevel}){
    float t=(${waterLevel}-origin.y)/d.y;
    vec3 p=origin+d*t;
    float warp=1.8*sin(.42*p.x+.19*p.z)+.65*sin(.73*p.z-.17*p.x);
    vec2 slope=vec2(0.);
    for(int i=0;i<4;i++){
      vec4 band=bands[i];
      slope+=normalize(band.xy)*band.z*cos(dot(p.xz,band.xy)+band.w*warp+waveTime*float(i+1))/(1.0+t*length(band.xy)*.0008);
    }
    vec3 n=normalize(vec3(-slope.x,1.,-slope.y));
    vec3 r=reflect(d,n);
    r.y=max(r.y,.0001);
    r=normalize(r);
    vec3 reflection=sky(r);
    // Reproject the virtual camera image along the perturbed reflection ray.
    vec3 probe=p+r*clamp(-dot(p.xz,r.xz),.45,8.);
    vec4 projected=mirrorVP*vec4(probe,1.);
    vec2 uv=projected.xy/projected.w*.5+.5;
    if(projected.w>0. && all(greaterThanEqual(uv,vec2(0.))) && all(lessThanEqual(uv,vec2(1.)))){
      vec4 chip=texture2D(mirrorImage,uv);
      reflection=reflection*(1.-chip.a)+chip.rgb;
    }
    float fresnel=.17+.83*pow(1.-clamp(dot(-d,n),0.,1.),5.);
    color=mix(waterTint,reflection,fresnel);
    color=mix(color,sky(normalize(vec3(d.x,.0001,d.z))),1.-exp(-t*.00085));
  }
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

// A full-screen plane intersection has no mesh edge and no far-clip horizon.
export class OceanPreview {
  constructor(image) {
    this.mirror = new T.PerspectiveCamera();
    this.target = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType });
    this.uniforms = {
      panorama: { value: null },
      bands: { value: new Float32Array(16) },
      skyTurn: { value: 0 },
      waveTime: { value: 0 },
      waterTint: { value: new T.Vector3() },
      mirrorImage: { value: this.target.texture },
      inverseProjection: { value: new T.Matrix4() },
      cameraWorld: { value: new T.Matrix4() },
      mirrorVP: { value: new T.Matrix4() },
    };
    this.setPanorama(image);
    this.setWater(defaultWater);
    const material = new T.ShaderMaterial({
      uniforms: this.uniforms,
      depthWrite: false,
      depthTest: false,
      vertexShader: "varying vec2 clipXY; void main(){clipXY=position.xy;gl_Position=vec4(clipXY, 0.99999, 1.);}",
      fragmentShader,
    });
    this.backdrop = new T.Mesh(new T.PlaneGeometry(2, 2), material);
    this.backdrop.frustumCulled = false;
    this.backdrop.renderOrder = -1000;
    this.size = new T.Vector2();
    this.direction = new T.Vector3();
  }
  setPanorama(image) {
    this.sky?.dispose();
    this.sky = new T.Texture(image);
    this.sky.mapping = T.EquirectangularReflectionMapping;
    this.sky.colorSpace = T.SRGBColorSpace;
    this.sky.wrapS = T.RepeatWrapping;
    this.sky.needsUpdate = true;
    this.uniforms.panorama.value = this.sky;
  }
  setWater(water) {
    this.uniforms.bands.value.set(water.bands.flatMap((b) => [b.x, b.z, b.amplitude, b.phase]));
    this.uniforms.waterTint.value.fromArray(water.color);
  }
  renderReflection(renderer, scene, camera) {
    const mirror = this.mirror;
    mirror.projectionMatrix.copy(camera.projectionMatrix);
    mirror.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    mirror.position.copy(camera.position);
    mirror.position.y = 2 * waterLevel - camera.position.y;
    camera.getWorldDirection(this.direction);
    this.direction.y *= -1;
    mirror.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    mirror.up.y *= -1;
    mirror.lookAt(this.direction.add(mirror.position));
    mirror.updateMatrixWorld();
    renderer.getDrawingBufferSize(this.size);
    this.target.setSize(Math.max(1, Math.round(this.size.x * 0.75)), Math.max(1, Math.round(this.size.y * 0.75)));
    this.uniforms.mirrorVP.value.multiplyMatrices(mirror.projectionMatrix, mirror.matrixWorldInverse);
    this.uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
    this.uniforms.cameraWorld.value.copy(camera.matrixWorld);
    const previousTarget = renderer.getRenderTarget(),
      alpha = renderer.getClearAlpha();
    this.backdrop.visible = false;
    renderer.setRenderTarget(this.target);
    renderer.setClearAlpha(0);
    try {
      renderer.render(scene, mirror);
    } finally {
      renderer.setClearAlpha(alpha);
      renderer.setRenderTarget(previousTarget);
      this.backdrop.visible = true;
    }
  }
}
