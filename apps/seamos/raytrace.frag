#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D nodes, primitives, vertices, instances, tints, materials, panorama, previous;
uniform mat4 camera;
uniform int cutAxis; // -1 for the open view, 0 or 2 for the horizontal layout axes
uniform bool oxide;
uniform vec3 oxideLo, oxideHi;
uniform float oxideIOR;
uniform vec2 resolution, pixelOrigin, stackRange;
uniform vec3 filmFace, filmRim;
float firstHeight;
uniform float tanFov, aspect, waterHeight;
uniform int layerCount, sampleNumber;
uniform bool useTints, ocean, grid;
uniform vec3 sun, sunlight, waterColor;
uniform vec4 bands[4];
out vec4 radiance;

const float eps = 0.000015;
const float farT = 1e30;
const float pi = 3.141592653589793;
uint rng;
float random01() {
  rng = rng * 747796405u + 2891336453u;
  uint x = ((rng >> ((rng >> 28u) + 4u)) ^ rng) * 277803737u;
  return float((x >> 22u) ^ x) / 4294967296.0;
}

vec4 entry(sampler2D data, int id) {
  int width = textureSize(data, 0).x;
  return texelFetch(data, ivec2(id % width, id / width), 0);
}

struct Ray { vec3 o; vec3 d; };
struct Hit { float t; vec3 normal; int layer; int tint; };

vec3 inverseDirection(vec3 d) {
  return mix(vec3(-1.0),vec3(1.0),greaterThanEqual(d,vec3(0))) / max(abs(d), vec3(1e-22));
}
bool crosses(vec3 origin, vec3 inv, vec3 lo, vec3 hi, float limit) {
  vec3 a = (lo-origin)*inv, b = (hi-origin)*inv;
  vec3 low = min(a,b), high = max(a,b);
  return max(eps,max(low.x,max(low.y,low.z))) <= min(limit,min(high.x,min(high.y,high.z)));
}
int treeEnd(int root) {
  return entry(nodes, 2*root+1).w > 0.0 ? root+1 : int(entry(nodes,2*root).w);
}

// Directions retain their world-distance parameter across both affine transforms.
bool meshHit(Ray ray, int root, int layer, bool shadow, float nearT, inout Hit best) {
  vec3 inv=inverseDirection(ray.d);
  int end=treeEnd(root);
  bool found=false;
  for(int node=root; node<end;) {
    vec4 lo=entry(nodes,2*node), hi=entry(nodes,2*node+1);
    int count=int(hi.w);
    if(!crosses(ray.o,inv,lo.xyz,hi.xyz,best.t)) {
      node=count==0 ? int(lo.w) : node+1;
      continue;
    }
    node++;
    for(int j=0;j<count;j++) {
      ivec3 ids=ivec3(entry(primitives,int(lo.w)+j).xyz);
      vec4 a=entry(vertices,ids.x);
      vec3 e1=entry(vertices,ids.y).xyz-a.xyz, e2=entry(vertices,ids.z).xyz-a.xyz;
      vec3 p=cross(ray.d,e2);
      float det=dot(e1,p);
      if(abs(det)<1e-20) continue;
      vec3 s=ray.o-a.xyz;
      float u=dot(s,p)/det;
      if(u<0.0 || u>1.0) continue;
      vec3 q=cross(s,e1);
      float v=dot(ray.d,q)/det;
      if(v<0.0 || u+v>1.0) continue;
      float t=dot(e2,q)/det;
      if(t<=nearT || t>=best.t) continue;
      best=Hit(t,normalize(cross(e1,e2)),layer,int(a.w));
      found=true;
      if(shadow) return true;
    }
  }
  return found;
}

bool placedHit(Ray ray, int root, int layer, bool shadow, float nearT, inout Hit best) {
  int end=treeEnd(root);
  vec3 inv=inverseDirection(ray.d);
  bool found=false;
  for(int node=root; node<end;) {
    vec4 lo=entry(nodes,2*node), hi=entry(nodes,2*node+1);
    int count=int(hi.w);
    if(!crosses(ray.o,inv,lo.xyz,hi.xyz,best.t)) {
      node=count==0 ? int(lo.w) : node+1;
      continue;
    }
    node++;
    for(int j=0;j<count;j++) {
      int id=int(entry(primitives,int(lo.w)+j).x);
      vec4 m=entry(instances,2*id), ref=entry(instances,2*id+1);
      float det=m.x*m.w-m.y*m.z;
      if(det==0.0) continue;
      mat2 toCell=mat2(m.w,-m.y,-m.z,m.x)/det;
      Ray local=ray;
      local.o.xz=toCell*(ray.o.xz-ref.xy);
      local.d.xz=toCell*ray.d.xz;
      if(meshHit(local,int(ref.z),layer,shadow,nearT,best)) {
        best.normal.xz=transpose(toCell)*best.normal.xz;
        best.tint=int(ref.w);
        found=true;
        if(shadow) return true;
      }
    }
  }
  return found;
}

bool layerHit(Ray local, vec4 placement, int layer, bool shadow, float nearT, inout Hit best) {
  if(placement.w>0.) return placedHit(local,int(placement.z),layer,shadow,nearT,best);
  return meshHit(local,int(placement.z),layer,shadow,nearT,best);
}

Hit oxideHit(Ray ray) {
  vec3 inv=inverseDirection(ray.d), a=(oxideLo-ray.o)*inv,b=(oxideHi-ray.o)*inv;
  vec3 lo=min(a,b),hi=max(a,b);
  float enter=max(lo.x,max(lo.y,lo.z)),leave=min(hi.x,min(hi.y,hi.z));
  if(leave<enter || leave<=eps) return Hit(farT,vec3(0),-1,0);
  bool outside=enter>eps;
  vec3 bounds=outside?lo:hi;
  float t=outside?enter:leave;
  int axis=t==bounds.x?0:(t==bounds.y?1:2);
  vec3 n=vec3(0);n[axis]=sign(ray.d[axis])*(outside?-1.:1.);
  return Hit(t,n,-3,0);
}

// Search only the retained half-space. At the cut plane a vertical probe
// finds the upper face of an extrusion, including its bevel and instance tint.
Hit nearest(Ray ray, bool shadow) {
  float nearT=eps, farClip=farT, cutT=-1.;
  if(cutAxis>=0) {
    float d=ray.d[cutAxis], offset=oxideHi[cutAxis]-ray.o[cutAxis];
    if(abs(d)<1e-15) { if(offset<0.) farClip=0.; }
    else {
      cutT=offset/d;
      if(d<0.) nearT=max(nearT,cutT);
      else farClip=min(farClip,cutT);
    }
  }
  Hit best=Hit(farClip,vec3(0),-1,0);
  for(int k=0;k<layerCount;k++) {
    int layer=ray.d.y<0.0 ? layerCount-1-k : k;
    vec4 layoutData=entry(materials,layer*3);
    if(layoutData.y<=0.0) continue;
    if(shadow && entry(materials,layer*3+1).w==2.0) continue;
    if(cutT>eps && cutT<=best.t+eps) {
      vec3 p=ray.o+ray.d*cutT;
      float h=(p.y-layoutData.x)/layoutData.y;
      if(h>=0. && h<=1.) {
        Hit top=Hit(farT,vec3(0),-1,0);
        if(layerHit(Ray(vec3(p.x,2.,p.z),vec3(0,-1,0)),layoutData,layer,false,eps,top) && 2.-top.t>=h) {
          vec3 n=vec3(0);n[cutAxis]=1.;best=Hit(cutT,n,layer,top.tint);
          if(shadow) return best;
        }
      }
    }
    if(best.t<=nearT) continue;
    float invY=inverseDirection(ray.d).y;
    vec2 bounds=(vec2(layoutData.x,layoutData.x+layoutData.y)-ray.o.y)*invY;
    if(max(bounds.x,bounds.y)<nearT || min(bounds.x,bounds.y)>best.t) continue;
    Ray local=ray;
    local.o.y=(ray.o.y-layoutData.x)/layoutData.y;
    local.d.y/=layoutData.y;
    if(layerHit(local,layoutData,layer,shadow,nearT,best)) {
      if(shadow) return best;
      best.normal.y/=layoutData.y;
      best.normal=normalize(best.normal);
    }
  }
  if(best.layer==-1) best.t=farT;
  if(!shadow && oxide) {
    Hit shell=oxideHit(ray);
    if(shell.t+eps<best.t) best=shell;
  }
  if(!shadow && ray.d.y<0.0) {
    float t=(waterHeight-ray.o.y)/ray.d.y;
    if(t>eps && t<best.t) best=Hit(t,vec3(0,1,0),-2,0);
  }
  return best;
}

float panel(vec2 p, vec2 center, vec2 size) {
  vec2 delta=abs(p-center)/size;
  return max(0.0,1.0-max(delta.x,delta.y));
}
vec3 environment(vec3 d) {
  if(ocean) {
    vec2 uv=vec2(atan(d.z,d.x)/(2.0*pi)+0.5,0.5-asin(clamp(d.y,-1.0,1.0))/pi);
    return textureLod(panorama,uv,0.0).rgb;
  }
  float upper=0.16+0.3*max(d.y,0.0);
  vec2 p=d.xz/max(d.y,0.01);
  float warm=step(0.0,d.y)*4.8*min(1.0,5.0*panel(p,vec2(-1,0.85),vec2(0.72,1)));
  float cool=step(0.0,d.y)*3.4*min(1.0,6.0*panel(p,vec2(1.4,-0.4),vec2(0.28,1.1)));
  return upper*vec3(1,1.05,1.13)+warm*vec3(1,0.92,0.82)+cool*vec3(0.78,0.9,1);
}
vec3 seaNormal(vec2 p,float t) {
  float warp=1.8*sin(dot(p,vec2(0.42,0.19)))+0.65*sin(dot(p,vec2(-0.17,0.73)));
  vec2 slope=vec2(0);
  for(int j=0;j<4;j++) {
    vec4 b=bands[j];
    float k=length(b.xy);
    slope+=b.xy/k * b.z*cos(dot(p,b.xy)+b.w*warp)/(1.0+t*k*0.0008);
  }
  return normalize(vec3(-slope.x,1,-slope.y));
}

vec3 trace(Ray ray) {
  vec3 sum=vec3(0), weight=vec3(1);
  bool primary=true;
  for(int bounce=0;bounce<=(oxide?6:4);bounce++) {
    Hit hit=nearest(ray,false);
    if(hit.layer==-1) return sum+weight*environment(ray.d);
    vec3 point=ray.o+ray.d*hit.t;
    if(primary && hit.layer>=0) firstHeight=1.+round(254.*clamp((point.y-stackRange.x)*stackRange.y,0.,1.));
    if(hit.layer==-3) {
      bool entering=dot(ray.d,hit.normal)<0.;
      vec3 n=entering?hit.normal:-hit.normal;
      float f0=pow((oxideIOR-1.)/(oxideIOR+1.),2.);
      float f=f0+(1.-f0)*pow(1.-clamp(-dot(ray.d,n),0.,1.),5.);
      vec3 transmitted=refract(ray.d,n,entering?1./oxideIOR:oxideIOR);
      bool pass=dot(transmitted,transmitted)>0. && random01()>f;
      if(!pass) primary=false;
      ray=Ray(point+n*(pass?-4.*eps:4.*eps),pass?transmitted:reflect(ray.d,n));
      continue;
    }
    primary=false;
    if(hit.layer==-2 && ocean) {
      vec3 n=seaNormal(point.xz,hit.t);
      float fres=0.17+0.83*pow(1.0-clamp(-dot(ray.d,n),0.0,1.0),5.0);
      float clear=exp(-hit.t*0.00085);
      vec3 horizon=environment(normalize(vec3(ray.d.x,0.0001,ray.d.z)));
      sum+=weight*((1.0-fres)*clear*waterColor+(1.0-clear)*horizon);
      weight*=fres*clear;
      ray.o=point+vec3(0,4.0*eps,0);
      ray.d=reflect(ray.d,n);
      ray.d.y=max(0.0001,ray.d.y);
      ray.d=normalize(ray.d);
      continue;
    }
    bool entering=dot(ray.d,hit.normal)<0.0;
    vec3 n=entering ? hit.normal : -hit.normal;
    vec3 light=normalize(sun+vec3(random01()-0.5,0,random01()-0.5)*(ocean?0.035:0.34));
    float visibility=nearest(Ray(point+n*eps*3.0,light),true).layer>=0 ? 0.09:1.0;
    if(hit.layer==-2) {
      vec2 line=abs(point.xz-round(point.xz));
      float base=grid && min(line.x,line.y)<0.012 ? 0.38:0.32;
      return sum+weight*base*(0.6+0.4*visibility)*vec3(0.76,0.91,1.12);
    }
    vec4 colorType=entry(materials,3*hit.layer+1), finish=entry(materials,3*hit.layer+2);
    vec3 c=useTints ? entry(tints,hit.tint).rgb : colorType.rgb;
    float cosine=clamp(-dot(n,ray.d),0.0,1.0);
    if(finish.w>0.5) c=mix(c,mix(filmFace,filmRim,smoothstep(0.,1.,1.-cosine)),0.82);
    float direct=max(0.0,dot(n,light))*visibility*1.1;
    vec3 local=ocean ? c*(0.26+direct*sunlight) : c*(0.26+direct)*vec3(1,0.96,0.89);
    bool glass=colorType.w==2.0;
    float metal=finish.y;
    if(!glass && metal<0.005) return sum+weight*local;
    vec3 adjacent=point+hit.normal*(8.*eps);
    float surrounding=oxide && all(greaterThan(adjacent,oxideLo)) && all(lessThan(adjacent,oxideHi)) ? oxideIOR : 1.;
    float relative=finish.z/surrounding;
    float f0=pow((relative-1.0)/(relative+1.0),2.0);
    float fres=f0+(1.0-f0)*pow(1.0-cosine,5.0);
    vec3 next=reflect(ray.d,n);
    bool transmit=false;
    if(glass) {
      vec3 transmitted=refract(ray.d,n,entering?1.0/relative:relative);
      transmit=dot(transmitted,transmitted)>0.0 && random01()>fres;
      if(transmit) {next=transmitted; weight*=0.68+0.32*c;}
    } else {
      sum+=weight*local*(1.0-metal*0.85);
      weight*=metal*(0.12+0.88*c)+fres*(1.0-metal);
    }
    next+=(vec3(random01(),random01(),random01())-0.5)*max(0.001,finish.x*finish.x)*0.56;
    ray=Ray(point+n*((transmit?-1.0:1.0)*4.0*eps),normalize(next));
  }
  return sum+weight*environment(ray.d);
}
void main() {
  ivec2 pixel=ivec2(gl_FragCoord.xy);
  ivec2 globalPixel=pixel+ivec2(pixelOrigin);
  firstHeight=0.;
  rng=uint(globalPixel.x)+uint(globalPixel.y)*uint(resolution.x)+uint(sampleNumber+1)*0x9e3779b9u;
  vec2 uv=(vec2(globalPixel)+vec2(random01(),random01()))/resolution;
  vec3 dir=normalize(mat3(camera)*vec3((uv.x*2.0-1.0)*aspect*tanFov,(1.0-uv.y*2.0)*tanFov,-1));
  vec3 rgb=trace(Ray(camera[3].xyz,dir));
  if(sampleNumber>1) { vec4 accum=texelFetch(previous,pixel,0); rgb+=accum.rgb; firstHeight=accum.a; }
  radiance=vec4(rgb,firstHeight);
}
