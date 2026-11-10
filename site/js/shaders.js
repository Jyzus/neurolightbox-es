const GLSL_NOISE = window.GLSL_NOISE = `
vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec4 mod289(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857; vec3 ns = n_*D.wyz - D.xzx;
  vec4 j = p - 49.0*floor(p*ns.z*ns.z); vec4 x_ = floor(j*ns.z); vec4 y_ = floor(j - 7.0*x_);
  vec4 x = x_*ns.x + ns.yyyy; vec4 y = y_*ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m*m;
  return 42.0*dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float hash13(vec3 p3){ p3 = fract(p3*0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y)*p3.z); }
`;

const VS_FULL = window.VS_FULL = `#version 300 es
void main(){ vec2 p = vec2(float((gl_VertexID<<1)&2), float(gl_VertexID&2)); gl_Position = vec4(p*2.0-1.0, 0.0, 1.0); }`;

/* ------------------------------------------------------------------ slice / glass program */
const FS_SLICE = window.FS_SLICE = `#version 300 es
precision highp float; precision highp int; precision highp sampler3D;
out vec4 fragColor;
uniform vec2 uRes; uniform vec3 uCamPos; uniform mat3 uCamRot; uniform float uTan; uniform vec3 uTarget;
uniform vec4 uGlass; uniform float uGlassR; uniform float uSlice; uniform float uSplit;
uniform int uMode; uniform float uHalf; uniform vec3 uTR; uniform vec3 uTU; uniform vec3 uTF;
uniform int uMod; uniform int uMod2;
uniform sampler3D uA; uniform sampler3D uB; uniform sampler3D uC; uniform vec3 uLo; uniform vec3 uDims; uniform vec3 uCal;
uniform sampler2D uVes; uniform int uNVes; uniform sampler2D uReg;
uniform int uNL; uniform vec4 uLC[12]; uniform vec4 uLR[12]; uniform vec4 uLP[12]; uniform float uLShow[12]; uniform int uHover;
uniform float uAtrophy; uniform float uHydro; uniform float uMetG; uniform float uYeoG[8]; uniform vec4 uMB[6]; uniform float uMBG[6]; uniform int uNMB;
uniform vec4 uAct[8]; uniform float uActA[8]; uniform int uNAct; uniform int uActYeo; uniform float uBold;
uniform float uTime; uniform int uNoFlow; uniform vec4 uProbe; uniform vec4 uBox; uniform float uFindings;
uniform mat4 uVP; uniform vec4 uClip; uniform float uDsa; uniform vec3 uBg; uniform float uShift;
` + GLSL_NOISE + `
float gFind = 0.0; int gFindId = -1; float gLod = 0.0; float gBR = 0.0; vec3 gBU = vec3(0.0), gBV = vec3(0.0);

vec3 tcOf(vec3 p){ return (vec3(90.0 - p.x, p.y + 126.0, p.z + 72.0) - uLo + 0.5)/uDims; }
bool inb(vec3 t){ return t.x >= 0.0 && t.y >= 0.0 && t.z >= 0.0 && t.x <= 1.0 && t.y <= 1.0 && t.z <= 1.0; }
vec4 sA(vec3 p){ vec3 t = tcOf(p); return inb(t) ? textureLod(uA, t, gLod) : vec4(0.0); }
vec4 sAl(vec3 p, float l){ vec3 t = tcOf(p); return inb(t) ? textureLod(uA, t, l) : vec4(0.0); }
vec4 sB(vec3 p){ vec3 t = tcOf(p); return inb(t) ? textureLod(uB, t, gLod) : vec4(0.0); }
ivec4 sC(vec3 p){ vec3 t = tcOf(p); return inb(t) ? ivec4(textureLod(uC, t, 0.0)*255.0 + 0.5) : ivec4(0); }
float gauss(vec3 p, vec3 c, float s){ vec3 d = p - c; return exp(-dot(d,d)/(2.0*s*s)); }
float ell(vec3 p, vec3 c, vec3 r){ return length((p - c)/r); }

/* ---------- vessels (segment texture: row0 a.xyz r, row1 b.xyz type) ---------- */
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa,ba)/max(dot(ba,ba),1e-6), 0.0, 1.0); return length(pa - ba*h) - r; }
vec2 vesSDF(vec3 p, out vec3 dir){
  float da = 1e4, dv = 1e4; dir = vec3(0.0, 1.0, 0.0);
  for (int i = 0; i < 200; i++){
    if (i >= uNVes) break;
    vec4 A = texelFetch(uVes, ivec2(i,0), 0); vec4 B = texelFetch(uVes, ivec2(i,1), 0);
    float d = sdCap(p, A.xyz, B.xyz, A.w);
    if (B.w > 0.5 && B.w < 1.5){ dv = min(dv, d); }
    else if (d < da){ da = d; dir = normalize(B.xyz - A.xyz); }
  }
  return vec2(da, dv);
}
float capHit(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float ra){
  vec3 ba = pb - pa; vec3 oa = ro - pa;
  float baba = dot(ba,ba), bard = dot(ba,rd), baoa = dot(ba,oa), rdoa = dot(rd,oa), oaoa = dot(oa,oa);
  float a = max(baba - bard*bard, 1e-6), b = baba*rdoa - baoa*bard, c = baba*oaoa - baoa*baoa - ra*ra*baba;
  float h = b*b - a*c;
  if (h >= 0.0){
    float t = (-b - sqrt(h))/a; float y = baoa + t*bard;
    if (y > 0.0 && y < baba) return t;
    vec3 oc = (y <= 0.0) ? oa : ro - pb;
    b = dot(rd, oc); c = dot(oc, oc) - ra*ra; h = b*b - c;
    if (h > 0.0) return -b - sqrt(h);
  }
  return -1.0;
}
// chord length of a ray through every vessel; x arteries (max), y arteries (sum), z veins (sum), w nidus
vec4 vesChords(vec3 ro, vec3 rd, float t0, float t1){
  vec4 r = vec4(0.0); const float FAR = 600.0;
  for (int i = 0; i < 200; i++){
    if (i >= uNVes) break;
    vec4 A = texelFetch(uVes, ivec2(i,0), 0); vec4 B = texelFetch(uVes, ivec2(i,1), 0);
    float ta = capHit(ro, rd, A.xyz, B.xyz, A.w);
    if (ta < 0.0) continue;
    float tb = FAR - capHit(ro + rd*FAR, -rd, A.xyz, B.xyz, A.w);
    float a = max(ta, t0), b = min(tb, t1);
    if (b <= a) continue;
    float ch = b - a;
    if (B.w > 0.5 && B.w < 1.5) r.z += ch;
    else { r.x = max(r.x, smoothstep(0.0, 0.9, ch)*(0.75 + 0.25*smoothstep(0.6, 2.0, A.w))); r.y += ch; if (B.w > 1.5) r.w += ch; }
  }
  return r;
}

/* ---------- tissue ---------- */
struct T { float air; float soft; float fat; float bone; float bden; float csf; float gm; float wm; float deep; float iron; float t1; float fa; float dIn; float vent; int lab; int jue; int yeo; int jhu; };
bool isVent(int l){ return l == 97 || l == 98 || l == 117 || l == 118; }
T baseTissue(vec3 p){
  T t; vec4 a = sA(p); vec4 b = sB(p); ivec4 c = sC(p);
  t.t1 = a.r; t.gm = a.g; t.wm = a.b; t.csf = a.a;
  t.bone = smoothstep(0.12, 0.45, b.r); t.bden = smoothstep(0.55, 0.95, b.r);
  t.dIn = b.g*25.0; t.fa = b.b*0.5;
  t.lab = c.r; t.jue = c.g; t.yeo = c.b; t.jhu = c.a;
  float ic = clamp(t.gm + t.wm + t.csf, 0.0, 1.0);
  float airIn = b.a*(1.0 - ic);
  float rest = max(0.0, 1.0 - ic - t.bone - airIn);
  float outAir = rest*(1.0 - smoothstep(0.03, 0.12, t.t1));
  rest -= outAir;
  t.fat = rest*smoothstep(0.72, 0.92, t.t1); t.soft = rest - t.fat; t.air = outAir + airIn;
  int L = t.lab;
  t.deep = (L >= 99 && L <= 106) || L == 111 || L == 112 ? 1.0 : 0.0;
  t.iron = (L == 105 || L == 106) ? 1.0 : ((L == 103 || L == 104) ? 0.35 : 0.0);
  t.vent = isVent(L) ? 1.0 : 0.0;
  return t;
}
const vec3 DIRS[6] = vec3[6](vec3(1,0,0), vec3(-1,0,0), vec3(0,1,0), vec3(0,-1,0), vec3(0,0,1), vec3(0,0,-1));

struct Les { float core; float rim; float ed; float blood; float bloom; float plaque; float black; float actv; float hip; float halo; float sah; float crack; float swell; float abscess; float nec; float clot; };

/* extra-axial collections push the brain inward; returns the point to sample brain tissue from */
vec3 extraAxial(vec3 p, out float blood){
  blood = 0.0; vec3 q = p;
  for (int i = 0; i < 12; i++){
    if (i >= uNL) break;
    int k = int(uLC[i].w + 0.5);
    if (k != 5 && k != 6) continue;
    float e = ell(p, uLC[i].xyz, uLR[i].xyz);
    if (e > 1.6) continue;
    float T_ = (k == 5) ? uLP[i].x*(1.0 - smoothstep(0.75, 1.0, e)) : uLP[i].x*max(0.0, 1.0 - e*e);
    if (T_ < 0.2) continue;
    vec4 a = sA(p); float ic = clamp(a.g + a.b + a.a, 0.0, 1.0);
    float dIn = sB(p).g*25.0;
    if (ic > 0.3 && dIn < T_){ blood = max(blood, smoothstep(0.0, 0.8, T_ - dIn)*smoothstep(0.3, 0.6, ic)); if (gFind < 0.9 && uLShow[i] > 0.5){ gFind = smoothstep(0.0, 1.0, T_ - dIn); gFindId = i; } }
    else {
      float h = 1.5;
      vec3 g = vec3(sB(p + vec3(h,0,0)).g - sB(p - vec3(h,0,0)).g, sB(p + vec3(0,h,0)).g - sB(p - vec3(0,h,0)).g, sB(p + vec3(0,0,h)).g - sB(p - vec3(0,0,h)).g);
      if (length(g) > 1e-4) q -= normalize(g)*T_*(1.0 - smoothstep(T_, T_ + 40.0, dIn));
    }
  }
  return q;
}

Les lesions(vec3 p, inout T t){
  Les L = Les(0.,0.,0.,0.,0.,0.,0.,0.,0.,0.,0.,0.,0.,0.,0.,0.);
  float par = clamp(t.gm + t.wm + t.deep*0.0, 0.0, 1.0);
  for (int i = 0; i < 12; i++){
    if (i >= uNL) break;
    int k = int(uLC[i].w + 0.5);
    vec3 c = uLC[i].xyz, r = uLR[i].xyz;
    float e = ell(p, c, r);
    float m = 0.0;
    if (k == 1){ // infarct
      if (e < 1.4){ float n = snoise(p*0.06)*0.14 + snoise(p*0.15)*0.05; m = smoothstep(1.05, 0.92, e + n)*par*(1.0 - t.vent); L.core = max(L.core, m); }
    } else if (k == 2){ // haematoma
      if (e < 1.9){ float n = snoise(p*0.18)*0.1; float cr = smoothstep(1.05, 0.95, e + n); L.core = max(L.core, cr); L.ed = max(L.ed, smoothstep(1.6, 1.25, e)*(1.0 - cr)*par); L.bloom = max(L.bloom, smoothstep(1.32, 1.15, e + n)); m = cr; }
    } else if (k == 3 || k == 9){ // tumour / abscess
      float edS = uLP[i].x;
      if (e < edS + 0.3){
        float n = (k == 3) ? snoise(p*0.16)*0.16 : snoise(p*0.1)*0.04;
        float d = e*(1.0 + n);
        float nec = smoothstep(k == 3 ? 0.56 : 0.8, k == 3 ? 0.48 : 0.74, d);
        float rim = smoothstep(1.0, k == 3 ? 0.9 : 0.95, d)*(1.0 - nec);
        float ed = smoothstep(edS, 1.05, d)*(1.0 - rim - nec)*clamp(t.wm*1.3, 0.0, 1.0);
        L.ed = max(L.ed, ed); L.rim = max(L.rim, rim);
        if (k == 3) L.nec = max(L.nec, nec); else L.abscess = max(L.abscess, nec);
        m = max(nec, rim);
      }
    } else if (k == 4){ // MS plaque
      if (e < 1.3){
        float pl = smoothstep(1.08, 0.9, e)*clamp(t.wm*1.4, 0.0, 1.0);
        L.plaque = max(L.plaque, pl);
        L.black = max(L.black, pl*uLP[i].x*smoothstep(0.85, 0.55, e));
        L.actv = max(L.actv, uLP[i].y*smoothstep(1.08, 0.95, e)*smoothstep(0.62, 0.8, e)*step(0.15, t.wm));
        m = pl;
      }
    } else if (k == 7){ // subarachnoid blood in cisterns/sulci
      if (e < 1.2){ m = smoothstep(1.0, 0.75, e)*t.csf*(1.0 - t.vent); L.sah = max(L.sah, m); }
    } else if (k == 8){ // hippocampal sclerosis
      bool hipL = (t.lab == 107); if (e < 1.3 && (hipL || t.vent > 0.5)){ m = hipL ? 1.0 : 0.0; L.hip = max(L.hip, m); }
    } else if (k == 11){ // fracture + scalp swelling
      vec3 dd = p - c;
      float pl = abs(dot(dd, normalize(uLP[i].xyz)));
      float near = 1.0 - smoothstep(r.x*0.8, r.x, length(dd));
      L.crack = max(L.crack, (1.0 - smoothstep(0.6, 1.4, pl))*near*t.bone);
      L.swell = max(L.swell, near*smoothstep(0.0, 0.5, t.soft + t.fat)*(1.0 - smoothstep(0.0, 6.0, t.dIn)));
      m = L.crack;
    } else if (k == 21){ // thrombus in an artery
      if (e < 1.3){ vec3 dir; float dv = vesSDF(p, dir).x; m = smoothstep(1.05, 0.85, e); L.clot = max(L.clot, m*smoothstep(0.6, -0.2, min(dv, length((p - c)/vec3(1.0, 1.8, 1.8)) - 1.6))); }
    } else if (k == 22){ // periventricular white-matter injury
      if (e < 1.2){ m = smoothstep(1.0, 0.7, e); L.halo = max(L.halo, m*clamp(t.wm*1.4, 0.0, 1.0)); }
    } else if (k == 20){ // outline-only region (metabolic / atrophy / vascular findings)
      m = smoothstep(1.02, 0.96, e);
    }
    if (uLShow[i] > 0.5 && k != 5 && k != 6 && m > gFind){ gFind = m; gFindId = i; }
  }
  return L;
}

T tissue(vec3 p, out Les L){
  float blood; vec3 q = extraAxial(p, blood);
  T t = baseTissue(q);
  if (uAtrophy > 0.0 || uHydro > 0.0){
    float mx = 0.0, mv = 0.0;
    float r1 = 1.2 + 2.0*uAtrophy, r2 = 2.0 + 3.5*uHydro;
    for (int i = 0; i < 6; i++){
      if (uAtrophy > 0.0) mx = max(mx, sA(q + DIRS[i]*r1).a);
      if (uHydro > 0.0){ vec3 qq = q + DIRS[i]*r2; if (isVent(sC(qq).r)) mv = max(mv, sA(qq).a); }
    }
    bool hip = (t.lab == 107 || t.lab == 108);
    float add = max(mx*(0.82 + (hip ? 0.18 : 0.0))*uAtrophy, mv*uHydro);
    if (hip && uAtrophy > 0.0) add = max(add, 0.5*uAtrophy);
    float brain = t.gm + t.wm;
    float nc = max(t.csf, min(add, t.csf + brain));
    float take = nc - t.csf;
    if (brain > 0.0){ t.gm -= take*t.gm/brain; t.wm -= take*t.wm/brain; }
    t.csf = nc;
    if (mv > 0.2 && uHydro > 0.0 && t.vent < 0.5) t.vent = max(t.vent, take);
  }
  L = lesions(q, t);
  L.blood = blood;
  if (uHydro > 0.0){
    float ring = 0.0;
    for (int i = 0; i < 6; i++) if (isVent(sC(q + DIRS[i]*(6.0)).r)) ring += 1.0/6.0;
    L.halo = ring*(1.0 - t.csf)*uHydro;
  }
  return t;
}

/* ---------- MR synthesis ---------- */
// components: air, soft, fat, bone(marrow/cortical), csf, gm, wm, deep
float mrSyn(T t, int sq){
  vec4 w1 = vec4(t.air, t.soft, t.fat, t.bone);
  vec4 w2 = vec4(t.csf, t.gm, t.wm, 0.0);
  float marrow = t.bone*(1.0 - t.bden);
  vec4 a, b;
  if (sq == 2){ a = vec4(0.0, 0.3, 0.6, 0.03); b = vec4(0.97, 0.55, 0.36, 0.0); }
  else if (sq == 3){ a = vec4(0.0, 0.25, 0.52, 0.03); b = vec4(0.05, 0.52, 0.37, 0.0); }
  else if (sq == 4){ a = vec4(0.0, 0.12, 0.03, 0.0); b = vec4(0.05, 0.4, 0.33, 0.0); }
  else { a = vec4(0.0, 0.36, 0.5, 0.05); b = vec4(0.64, 0.46, 0.56, 0.0); }
  float v = dot(w1, a) + dot(w2, b) + marrow*(sq == 2 ? 0.35 : sq == 3 ? 0.3 : 0.05);
  if (sq == 2) v -= 0.11*t.iron*t.gm;
  if (sq == 5) v -= 0.2*t.iron;
  return v;
}
float pick6(int sq, float a, float b, float c, float d, float e, float f){ return sq == 0 ? a : sq == 1 ? b : sq == 2 ? c : sq == 3 ? d : sq == 4 ? e : f; }
float mrValue(T t, Les L, int sq, vec3 p){
  float v = (sq <= 1) ? t.t1*1.05 : mrSyn(t, sq);
  if (sq <= 1 && (uAtrophy > 0.0 || uHydro > 0.0)){ float c0 = sA(p).a; v = mix(v, uCal.x, clamp((t.csf - c0)*1.4, 0.0, 1.0)); }
  // vessels: enhancement, flow voids
  if (sq == 1 || sq == 2 || sq == 3){
    vec3 dir; vec2 vs = vesSDF(p, dir);
    float art = smoothstep(0.3, -0.3, vs.x), vn = smoothstep(0.3, -0.3, vs.y);
    if (sq == 1) v = mix(v, 0.95, max(art, vn)); else v = mix(v, 0.03, art*0.9);
  }
  v = mix(v, pick6(sq, 0.42, 0.42, 0.78, 0.74, 0.92, v), L.core);
  v = mix(v, pick6(sq, 0.55, 0.58, 0.82, 0.8, 0.36, 0.6), L.ed);
  v = mix(v, pick6(sq, 0.45, 0.95, 0.62, 0.7, 0.55, 0.42), L.rim);
  v = mix(v, pick6(sq, 0.18, 0.16, 0.93, 0.4, 0.1, 0.56), L.nec);
  v = mix(v, pick6(sq, 0.38, 0.38, 0.9, 0.42, 0.95, 0.5), L.abscess);
  v = mix(v, pick6(sq, 0.62, 0.62, 0.88, 0.88, 0.45, 0.68), L.plaque);
  if (sq <= 1) v = mix(v, 0.28, L.black);
  if (sq == 1) v = mix(v, 0.95, L.actv);
  if (sq == 4) v = mix(v, 0.62, L.actv);
  v = mix(v, pick6(sq, 0.5, 0.5, 0.78, 0.76, 0.4, 0.47), L.hip);
  v = mix(v, pick6(sq, v, v, 0.7, 0.66, v, v), L.halo);
  v = mix(v, pick6(sq, 0.5, 0.5, 0.35, 0.85, 0.42, 0.1), L.sah);
  v = mix(v, pick6(sq, 0.74, 0.74, 0.72, 0.9, 0.42, 0.18), L.blood);
  v = mix(v, pick6(sq, v, v, 0.12, 0.85, v, 0.03), L.clot);
  return v;
}
// haematoma core has its own T2/SWI behaviour (deoxyhaemoglobin)
float mrHaem(float v, Les L, int sq, float isHaem){ return isHaem > 0.5 ? mix(v, pick6(sq, 0.42, 0.42, 0.14, 0.26, 0.12, 0.03), L.core) : v; }

/* ---------- CT ---------- */
float ctHU(T t, Les L, vec3 p, float isHaem){
  float hb = mix(450.0, 1650.0, t.bden);
  float hu = -1000.0*t.air + 42.0*t.soft - 95.0*t.fat + hb*t.bone*(1.0 - L.crack) + 30.0*L.crack + 6.0*t.csf + 39.0*t.gm + 28.0*t.wm;
  hu = mix(hu, isHaem > 0.5 ? 74.0 : 21.0, L.core);
  hu = mix(hu, 19.0, L.ed); hu = mix(hu, 33.0, L.rim); hu = mix(hu, 14.0, L.nec); hu = mix(hu, 18.0, L.abscess); hu = mix(hu, 23.0, L.plaque*0.6);
  hu = mix(hu, 24.0, L.halo); hu = mix(hu, 62.0, L.sah); hu = mix(hu, 68.0, L.blood); hu = mix(hu, 58.0, L.swell); hu = mix(hu, 82.0, L.clot);
  return hu;
}

/* ---------- PET / SPECT / ASL ---------- */
float yeoGainSmooth(vec3 p){
  float g = 0.0;
  for (int i = 0; i < 7; i++){
    vec3 o = i == 0 ? vec3(0.0) : DIRS[i - 1]*4.0;
    int y = sC(p + o).b; g += (y >= 0 && y < 8) ? uYeoG[y] : 1.0;
  }
  return g/7.0;
}
float metab(vec3 p){
  float g = uMetG*yeoGainSmooth(p);
  for (int i = 0; i < 6; i++){ if (i >= uNMB) break; g *= 1.0 + uMBG[i]*exp(-dot(p - uMB[i].xyz, p - uMB[i].xyz)/(2.0*uMB[i].w*uMB[i].w)); }
  return g;
}
float striatum(vec3 p){
  float s = 0.0;
  for (int i = 0; i < 7; i++){
    vec3 o = i == 0 ? vec3(0.0) : DIRS[i - 1]*3.5; int l = sC(p + o).r;
    s += (l >= 101 && l <= 104) ? 1.0 : 0.0;
  }
  return s/7.0;
}
float uptake(vec3 p, int tr, Les L, float isHaem){
  float lod = (tr >= 2) ? 2.3 : 1.4;
  vec4 a = sAl(p, lod);
  if (gBR > 0.0) a = 0.36*a + 0.16*(sAl(p + gBU*gBR, lod) + sAl(p - gBU*gBR, lod) + sAl(p + gBV*gBR, lod) + sAl(p - gBV*gBR, lod));
  int lab = sC(p).r;
  bool cb = (lab >= 114 && lab <= 116);
  float v;
  if (tr == 0) v = max(a.g - 0.12, 0.0)*1.22 + a.b*0.2;
  else if (tr == 1) v = a.b*0.78 + a.g*0.26;
  else if (tr == 2 || tr == 4) v = a.g*1.0 + a.b*0.24;
  else {
    float st = striatum(p);
    if (uMetG < 0.0) { float post = smoothstep(4.0, -14.0, p.y); float loss = p.x < 0.0 ? 0.85 : 0.6; if (lab == 103 || lab == 104 || st > 0.0) st *= 1.0 - loss*mix(0.45, 1.0, post); }
    v = 0.1*(a.g + a.b) + 0.9*st;
    return v;
  }
  if (cb && (tr == 2 || tr == 4)) v *= 1.15;
  if (tr != 1) v *= max(metab(p), 0.0);
  if (tr == 1 && uMetG > 1.5) v = a.b*0.78 + a.g*0.9;
  v *= 1.0 - 0.85*L.core*(isHaem > 0.5 ? 1.0 : 0.9);
  v *= 1.0 - 0.45*L.ed;
  v = mix(v, tr == 4 ? 1.6 : 1.45, L.rim*(tr == 1 ? 0.0 : 1.0));
  v *= 1.0 - 0.9*L.abscess; v = mix(v, 0.04, L.nec);
  return v;
}

/* ---------- fMRI ---------- */
float activation(vec3 p){
  float g = sAl(p, 1.0).g;
  float a = 0.0;
  for (int i = 0; i < 8; i++){ if (i >= uNAct) break; a += uActA[i]*gauss(p, uAct[i].xyz, uAct[i].w); }
  if (uActYeo > 0){ float n = 0.0; for (int i = 0; i < 7; i++){ vec3 o = i == 0 ? vec3(0.0) : DIRS[i - 1]*3.0; n += sC(p + o).b == uActYeo ? 1.0 : 0.0; } a += 0.95*n/7.0; }
  return a*smoothstep(0.15, 0.45, g);
}

/* ---------- DTI ---------- */
const vec3 JHUD[49] = vec3[49](vec3(0.5), vec3(1.0,0.3,0.2), vec3(1.0,0.0,0.0), vec3(1.0,0.3,0.0), vec3(1.0,0.0,0.1), vec3(1.0,0.3,0.0), vec3(0.0,0.8,0.6),
  vec3(0.0,0.15,1.0), vec3(0.0,0.15,1.0), vec3(0.0,0.2,1.0), vec3(0.0,0.2,1.0), vec3(0.3,0.4,0.9), vec3(0.3,0.4,0.9), vec3(0.2,0.6,0.8), vec3(0.2,0.6,0.8), vec3(0.2,0.4,0.9), vec3(0.2,0.4,0.9),
  vec3(0.3,0.9,0.3), vec3(0.3,0.9,0.3), vec3(0.1,0.2,1.0), vec3(0.1,0.2,1.0), vec3(0.3,0.8,0.4), vec3(0.3,0.8,0.4), vec3(0.3,0.7,0.6), vec3(0.3,0.7,0.6), vec3(0.15,0.15,1.0), vec3(0.15,0.15,1.0),
  vec3(0.3,0.6,0.7), vec3(0.3,0.6,0.7), vec3(0.2,1.0,0.1), vec3(0.2,1.0,0.1), vec3(0.1,1.0,0.2), vec3(0.1,1.0,0.2), vec3(0.15,0.9,0.4), vec3(0.15,0.9,0.4), vec3(0.0,1.0,0.15), vec3(0.0,1.0,0.15),
  vec3(0.1,0.8,0.6), vec3(0.1,0.8,0.6), vec3(0.3,0.7,0.6), vec3(0.3,0.7,0.6), vec3(0.1,1.0,0.2), vec3(0.1,1.0,0.2), vec3(0.2,1.0,0.2), vec3(0.2,1.0,0.2), vec3(0.4,0.8,0.4), vec3(0.4,0.8,0.4), vec3(0.3,0.6,0.7), vec3(0.3,0.6,0.7));
vec3 fibDir(int i){ float z = (float(i) - 0.5)/255.0; float r = sqrt(max(0.0, 1.0 - z*z)); float ph = float(i)*2.399963229728653; return vec3(r*cos(ph), r*sin(ph), z); }
vec3 dtiColor(T t, Les L, vec3 p){
  vec3 d = t.jue > 0 ? abs(fibDir(t.jue)) : vec3(0.42);
  float fa = t.fa*2.0;
  fa *= 1.0 - 0.6*L.core - 0.85*L.nec - 0.85*L.rim - 0.5*L.ed - 0.5*L.plaque - 0.9*L.abscess;
  return d*clamp(fa*1.45, 0.0, 1.0);
}

/* ---------- colour maps ---------- */
vec3 hotCol(float x){ x = clamp(x, 0.0, 1.0); return vec3(clamp(x*2.6, 0.0, 1.0), clamp(x*2.6 - 0.9, 0.0, 1.0), clamp(x*3.0 - 2.0, 0.0, 1.0)); }
vec3 rainbow(float x){ x = clamp(x, 0.0, 1.0); vec3 c = clamp(vec3(1.5 - abs(4.0*x - 3.2), 1.5 - abs(4.0*x - 2.1), 1.5 - abs(4.0*x - 1.0)), 0.0, 1.0); return c*smoothstep(0.05, 0.15, x); }
vec3 actCol(float z){ return z >= 0.0 ? mix(vec3(0.86,0.1,0.04), vec3(1.0,0.95,0.38), smoothstep(0.32, 0.9, z)) : mix(vec3(0.1,0.3,0.95), vec3(0.4,0.9,1.0), smoothstep(-0.32, -0.9, z)); }

/* ---------- ultrasound ---------- */
float imped(vec3 p){ vec4 a = sA(p); vec4 b = sB(p); return a.a*1.0 + a.g*1.07 + a.b*1.12 + smoothstep(0.12, 0.45, b.r)*2.5 + (1.0 - a.g - a.b - a.a)*1.0; }
vec3 ultrasound(vec3 p, vec3 U, vec3 V, int doppler){
  vec3 apex = uProbe.xyz;
  vec3 beamAxis = (doppler == 1) ? normalize(vec3(-sign(apex.x), 0.0, 0.0)) : vec3(0.0, 0.0, -1.0);
  vec3 ax2 = normalize(U*dot(beamAxis, U) + V*dot(beamAxis, V));
  vec3 v = p - apex; float r = length(v);
  float ang = acos(clamp(dot(v/r, ax2), -1.0, 1.0));
  float maxDepth = doppler == 1 ? 150.0 : 125.0;
  if (ang > (doppler == 1 ? 0.62 : 0.95) || r > maxDepth || r < 4.0) return vec3(0.0);
  vec3 bd = v/r;
  float z0 = imped(p), z1 = imped(p - bd*0.9);
  float refl = clamp(abs(z1 - z0)*6.0, 0.0, 1.0);
  Les L; T t = tissue(p, L);
  float scat = t.gm*0.3 + t.wm*0.38 + t.csf*0.015 + (t.soft + t.fat)*0.3 + t.bone*0.6 + L.core*0.95 + L.halo*0.75;
  float shadow = 0.0;
  for (int i = 1; i < 28; i++){ float s = r*float(i)/28.0; vec3 q = apex + bd*s; float b = smoothstep(0.12, 0.45, sB(q).r); float win = (doppler == 0) ? smoothstep(16.0, 24.0, s) : smoothstep(10.0, 16.0, s); shadow += b*win*(doppler == 1 ? 0.18 : 0.6); }
  float atten = exp(-shadow*0.6)*exp(-r*0.004);
  vec3 tang = normalize(cross(bd, cross(U, V)));
  vec3 cell = vec3(floor(r/0.45), floor(dot(p, tang)/1.3), 0.0);
  float sp = 0.5*(hash13(cell + 17.0) + hash13(cell + vec3(0.0, 1.0, 0.0) + 17.0)); sp = 0.35 + 1.1*sp*sp;
  float val = (scat*sp*0.75 + refl*1.6)*atten*(0.5 + r*0.005);
  vec3 col = vec3(clamp(val, 0.0, 1.0));
  if (doppler == 1){
    vec3 dir; vec2 vs = vesSDF(p, dir);
    float inV = smoothstep(0.6, -0.4, vs.x);
    if (inV > 0.0 && uNoFlow == 0){ float tw = dot(dir, -bd); float pulse = 0.65 + 0.35*sin(uTime*7.0); col = mix(col, tw > 0.0 ? vec3(0.95, 0.2*pulse, 0.12) : vec3(0.15, 0.35*pulse, 0.95), inV*smoothstep(0.05, 0.25, abs(tw))); }
  }
  return col;
}

/* ---------- main scan synthesis at plane point ---------- */
vec3 scanColor(int M, vec3 ro, vec3 rd, vec3 P0, vec3 N, vec3 U, vec3 V, vec2 uv){
  float vox = (M >= 10 && M < 20) ? 0.5 : (M == 4 ? 1.8 : (M == 6 ? 1.6 : (M == 20 || M == 21 ? 2.0 : (M == 22 || M == 23 ? 3.0 : (M == 8 ? 2.5 : 0.75)))));
  // Display like a clinical viewer: the acquisition voxel size blurs the image (mip level),
  // and the result is interpolated rather than drawn as hard blocks. Noise is smooth grain.
  vec2 q = uv;
  vec3 p = P0 + U*q.x + V*q.y;
  vec3 ps = p;
  gLod = max(gLod, log2(max(vox, 1.0)) + 0.15*step(1.5, vox));
  float nz = 0.55*snoise(vec3(uv/vox*1.15, float(M)*3.7 + 1.3)) + 0.25*snoise(vec3(uv/vox*2.6, float(M) + 7.0));
  float isHaem = 0.0;
  for (int i = 0; i < 12; i++){ if (i < uNL && int(uLC[i].w + 0.5) == 2) isHaem = 1.0; }

  if (M == 7){ // TOF MRA MIP
    vec4 ch = vesChords(ro, rd, 0.0, 1e4);
    float bg = 0.0; vec4 a; for (int i = 0; i < 24; i++){ a = sAl(ro + rd*(dot(uTarget - ro, rd) - 110.0 + float(i)*9.5), 2.5); bg = max(bg, a.g*0.1 + a.b*0.08 + smoothstep(0.75, 0.95, a.r)*0.25); }
    return vec3(clamp(max(ch.x*0.97, bg) + nz*0.03, 0.0, 1.0));
  }
  if (M == 60){ // DSA projection (subtracted)
    vec4 ch = vesChords(ro, rd, 0.0, 1e4);
    float ph = uDsa;
    float art = smoothstep(0.0, 0.12, ph)*(1.0 - smoothstep(0.42, 0.62, ph));
    float cap = smoothstep(0.3, 0.5, ph)*(1.0 - smoothstep(0.7, 0.85, ph));
    float ven = smoothstep(0.55, 0.72, ph)*(1.0 - smoothstep(0.95, 1.0, ph));
    float nidus = smoothstep(0.08, 0.2, ph)*(1.0 - smoothstep(0.5, 0.7, ph));
    float blush = 0.0;
    if (uNoFlow == 0){ float t0 = dot(uTarget - ro, rd) - 100.0; for (int i = 0; i < 20; i++){ blush += sAl(ro + rd*(t0 + float(i)*10.0), 3.0).g; } }
    float dens = (ch.y - ch.w)*art*0.55 + ch.w*0.9*max(art, nidus) + ch.z*0.45*(ven + (ch.w > 0.0 ? 0.0 : 0.0)) + blush*cap*0.09;
    float tr = exp(-dens*1.5);
    return vec3(0.92*tr + 0.04 + nz*0.02);
  }
  if (M >= 20 && M < 30 || M == 8){
    int tr = M == 20 ? 0 : M == 21 ? 1 : M == 22 ? 2 : M == 23 ? 3 : 4;
    // reconstructed emission images are smooth: ~4-5 mm FWHM for PET, ~8 mm for SPECT/ASL.
    // uptake() blurs its tissue fetch with a 5-tap kernel in the slice plane (cheap: texture reads only,
    // so the shader stays small enough for Windows/ANGLE drivers).
    Les L; T t0 = tissue(p, L);
    gBR = (M >= 22 || M == 8) ? 3.0 : 1.7; gBU = (U + V)*0.7071; gBV = (U - V)*0.7071;
    float f = (uNoFlow == 1 && (tr == 2 || tr == 4)) ? 0.0 : uptake(p, tr, L, isHaem);
    gBR = 0.0;
    // count noise is correlated at the resolution scale (mottled), not per pixel
    float sN = (M >= 22 || M == 8) ? 15.0 : 9.0;
    float nzE = 0.62*snoise(vec3(uv/sN, float(M)*3.7 + 1.3)) + 0.3*snoise(vec3(uv/(sN*0.55), float(M) + 7.0));
    f = max(f*(1.0 + nzE*((M >= 22) ? 0.26 : (M == 8 ? 0.2 : 0.14))), 0.0);
    if (tr == 2 && uNoFlow == 1){ vec4 b = sB(p); f = smoothstep(0.1, 0.4, b.r)*0.25 + (1.0 - sA(p).g - sA(p).b)*sAl(p, 2.0).r*0.18; }
    if (M == 21) return vec3(clamp(f/0.95, 0.0, 1.0));
    if (M == 20) return hotCol(pow(f/1.1, 1.7));
    if (M == 8){ vec3 col = rainbow(pow(f/0.72, 1.15)); return col; }
    return rainbow(pow(f/(M == 22 ? 0.78 : 1.05), 1.25));
  }
  if (M == 50 || M == 51) return ultrasound(p, U, V, M == 51 ? 1 : 0);

  Les L; T t = tissue(p, L);
  if (M >= 10 && M < 20){
    float hu = ctHU(t, L, p, isHaem) + nz*7.0;
    float v;
    if (M == 11) v = (hu + 800.0)/2800.0;
    else if (M == 12){
      vec4 ch = vesChords(p - N*10.0, N, 0.0, 20.0);
      if (uNoFlow == 1) ch.x = 0.0;
      hu = max(hu, ch.x*400.0);
      v = (hu + 150.0)/700.0;
    } else v = hu/80.0;
    return vec3(clamp(v, 0.0, 1.0));
  }
  if (M == 6) return dtiColor(t, L, p);
  if (M == 30){
    float v = mrValue(t, L, 0, p) + nz*0.015;
    vec3 col = vec3(clamp(v*0.95, 0.0, 1.0));
    float z = activation(ps)*uBold;
    return mix(col, actCol(z), smoothstep(0.24, 0.34, abs(z)));
  }
  int sq = (M == 9) ? 2 : M;
  float v = mrHaem(mrValue(t, L, sq, p), L, sq, isHaem);
  if (sq == 5){ // SWI minimum-intensity slab for veins
    float mn = 1e4; for (int i = 0; i < 5; i++){ vec3 d; mn = min(mn, vesSDF(p + N*(float(i) - 2.0)*2.0, d).y); }
    v = mix(v, 0.04, smoothstep(0.4, -0.3, mn));
    vec3 rad = normalize(p - vec3(0.0, -12.0, 14.0)); vec3 qn = p - rad*dot(p, rad)*0.82;
    float mvn = abs(snoise(qn*0.32 + 3.1)); v *= 1.0 - 0.5*(1.0 - smoothstep(0.0, 0.07, mvn))*smoothstep(0.35, 0.7, t.wm);
    float cvn = abs(snoise(p*0.11 + 9.0)); v *= 1.0 - 0.55*(1.0 - smoothstep(0.0, 0.08, cvn))*smoothstep(0.3, 0.8, t.csf)*smoothstep(0.5, 6.0, t.dIn)*(1.0 - smoothstep(10.0, 16.0, t.dIn));
    v = mix(v, 0.03, L.bloom*isHaem);
    if (L.rim > 0.3 && hash13(floor(p*0.9)) > 0.82) v = 0.05;
  }
  v += nz*((M == 4) ? 0.06 : 0.02);
  vec3 col = vec3(clamp(v, 0.0, 1.0));
  if (M == 9){ // MRS voxel box
    vec3 d = abs(ps - uBox.xyz) - uBox.w;
    float e = max(max(d.x, d.y), d.z);
    vec3 dd = abs(ps - uBox.xyz);
    float inPlane = step(max(max(dd.x, dd.y), dd.z), uBox.w + 0.5);
    float edge = inPlane*(1.0 - smoothstep(0.0, 0.8, abs(e)));
    col = mix(col, vec3(0.95, 0.75, 0.3), edge);
  }
  return col;
}

vec3 planeColor(int M, vec3 ro, vec3 rd, vec3 P0, vec3 N, vec3 U, vec3 V, out vec2 uvOut){
  float tt = dot(P0 - ro, N)/dot(rd, N);
  vec3 p = ro + rd*tt;
  vec2 uv = vec2(dot(p - P0, U), dot(p - P0, V));
  uvOut = uv;
  return scanColor(M, ro, rd, P0, N, U, V, uv);
}

void main(){
  vec2 fc = gl_FragCoord.xy;
  gLod = uMode == 1 ? max(0.0, log2(2.0*uHalf/uRes.y)) : max(0.0, log2(2.0*uTan*(length(uCamPos - uTarget) + uSlice)/min(uRes.x, uRes.y)));
  if (uMode == 1){ // thumbnail: orthographic plane
    vec2 uv = (fc/uRes*2.0 - 1.0)*uHalf;
    vec3 P0 = uTarget + uTF*uSlice;
    vec3 p = P0 + uTR*uv.x + uTU*uv.y;
    vec3 col = scanColor(uMod, p - uTF*300.0, uTF, P0, uTF, uTR, uTU, uv);
    fragColor = vec4(col, 1.0); return;
  }
  vec2 uv = (fc - 0.5*uRes - vec2(uShift, 0.0))/(0.5*min(uRes.x, uRes.y));
  vec3 cR = uCamRot[0], cU = uCamRot[1], cF = uCamRot[2];
  vec3 rd = normalize(cR*uv.x*uTan + cU*uv.y*uTan + cF);
  vec3 ro = uCamPos;
  if (uMode == 2){ // lab cut cap
    float den = dot(rd, uClip.xyz); if (abs(den) < 1e-5) discard;
    float t = -(dot(ro, uClip.xyz) + uClip.w)/den; if (t < 0.0) discard;
    vec3 p = ro + rd*t;
    int lab = sC(p).r; int rid = lab >= 128 ? lab - 128 : lab;
    if (rid <= 0) discard;
    vec4 rc = texelFetch(uReg, ivec2(rid, 0), 0);
    if (rc.a < 0.5) discard;
    vec4 a = sA(p);
    vec3 col = rc.rgb*(0.35 + 0.75*a.r);
    if (lab >= 128) col = mix(col, vec3(0.92, 0.9, 0.85)*(0.4 + 0.7*a.r), 0.55);
    vec4 cp = uVP*vec4(p, 1.0);
    gl_FragDepth = clamp(cp.z/cp.w*0.5 + 0.5, 0.0, 1.0);
    fragColor = vec4(col, 1.0); return;
  }
  vec2 gq = abs(fc - uGlass.xy) - uGlass.zw + uGlassR;
  float gd = length(max(gq, 0.0)) + min(max(gq.x, gq.y), 0.0) - uGlassR;
  float gmk = 1.0 - smoothstep(-0.75, 0.75, gd);
  if (gmk <= 0.0) discard;
  if (uMode == 3){ fragColor = vec4(uBg*0.55, gmk); return; }
  vec3 P0 = uTarget + cF*uSlice;
  int M = (uSplit > 0.0 && fc.x > uSplit) ? uMod2 : uMod;
  vec2 puv; vec3 col = planeColor(M, ro, rd, P0, cF, cR, cU, puv);
  // findings outline
  if (uFindings > 0.5 && gFindId >= 0 && M != 7 && M != 60){
    float w = fwidth(gFind);
    float line = 1.0 - smoothstep(0.0, max(w*1.6, 0.02), abs(gFind - 0.5));
    bool hov = (gFindId == uHover);
    float dash = step(0.5, fract((puv.x + puv.y)*0.22));
    vec3 lc = hov ? vec3(1.0, 0.86, 0.45) : vec3(0.98, 0.72, 0.3);
    col = mix(col, lc, line*(hov ? 1.0 : 0.85*mix(0.35, 1.0, dash)));
    if (hov) col = mix(col, vec3(1.0, 0.75, 0.3), 0.12*step(0.5, gFind));
  }
  if (uSplit > 0.0) col = mix(col, vec3(0.95, 0.75, 0.35), 1.0 - smoothstep(0.0, 1.2, abs(fc.x - uSplit)));
  fragColor = vec4(col, gmk);
}`;

/* ------------------------------------------------------------------ mesh program */
const VS_MESH = window.VS_MESH = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec4 aNrm; layout(location=2) in float aReg;
uniform mat4 uVP; uniform sampler2D uReg; uniform int uScalp;
out vec3 vPos; out vec3 vW; out vec3 vN; out float vCav; flat out int vR;
void main(){
  int r = uScalp == 1 ? 0 : int(aReg + 0.5);
  vec4 col = texelFetch(uReg, ivec2(r, 0), 0);
  vec4 off = texelFetch(uReg, ivec2(r, 1), 0);
  vPos = aPos/64.0; vW = vPos + off.xyz; vN = aNrm.xyz; vCav = aNrm.w; vR = r;
  gl_Position = uVP*vec4(vW, 1.0);
  if (uScalp == 0 && col.a < 0.5) gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
}`;

const FS_MESH = window.FS_MESH = `#version 300 es
precision highp float; precision highp int; precision highp sampler3D;
out vec4 o;
in vec3 vPos; in vec3 vW; in vec3 vN; in float vCav; flat in int vR;
uniform int uLook; uniform vec3 uCamPos; uniform mat3 uCamRot; uniform sampler2D uReg;
uniform vec4 uClip; uniform int uClipOn; uniform int uHoverR; uniform int uSelR;
uniform vec4 uAct[8]; uniform float uActA[8]; uniform int uNAct; uniform float uBold;
uniform vec4 uStim; uniform vec4 uGlass; uniform float uGlassR; uniform int uGlassOnly;
uniform vec4 uSrc[10]; uniform float uSrcA[10]; uniform int uNSrc;
uniform vec3 uElec[19]; uniform int uShowElec;
uniform vec4 uDip[3]; uniform vec4 uDipQ[3]; uniform int uNDip;
uniform float uTime; uniform sampler3D uB; uniform vec3 uLo; uniform vec3 uDims;
float gauss(vec3 p, vec3 c, float s){ vec3 d = p - c; return exp(-dot(d,d)/(2.0*s*s)); }
vec3 rdbu(float x){
  x = clamp(x, -1.0, 1.0);
  vec3 neg = mix(vec3(0.96,0.96,0.97), vec3(0.13,0.33,0.75), smoothstep(0.0, 1.0, -x));
  vec3 pos = mix(vec3(0.96,0.96,0.97), vec3(0.78,0.15,0.16), smoothstep(0.0, 1.0, x));
  return x < 0.0 ? neg : pos;
}
vec3 actCol(float z){ return z >= 0.0 ? mix(vec3(0.86,0.1,0.04), vec3(1.0,0.95,0.38), smoothstep(0.32, 0.9, z)) : mix(vec3(0.1,0.3,0.95), vec3(0.4,0.9,1.0), smoothstep(-0.32, -0.9, z)); }
void main(){
  if (uGlassOnly == 1){
    vec2 gq = abs(gl_FragCoord.xy - uGlass.xy) - uGlass.zw + uGlassR;
    float gd = length(max(gq, 0.0)) + min(max(gq.x, gq.y), 0.0) - uGlassR;
    if (gd > 0.0) discard;
  }
  if (uClipOn == 1 && dot(vPos, uClip.xyz) + uClip.w > 0.0) discard;
  if (uLook == 4){ // picking
    vec3 v = clamp(vec3(90.0 - vPos.x, vPos.y + 126.0, vPos.z + 72.0), 0.0, 255.0);
    o = vec4(float(vR)/255.0, v/255.0); return;
  }
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 cR = uCamRot[0], cU = uCamRot[1], cF = uCamRot[2];
  vec3 rd = normalize(vW - uCamPos);
  vec3 L1 = normalize(-cF*0.55 + cU*0.75 - cR*0.45), L2 = normalize(-cF*0.3 - cU*0.35 + cR*0.85);
  float dif = clamp(dot(n, L1)*0.55 + 0.45, 0.0, 1.0); dif *= dif;
  float dif2 = clamp(dot(n, L2), 0.0, 1.0);
  float spec = pow(clamp(dot(n, normalize(L1 - rd)), 0.0, 1.0), 40.0);
  float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
  // cavity term from curvature: sulci face away from the outward radial direction
  // baked per-vertex cavity: +1 on gyral crowns, -1 deep in sulci (sulcal depth + curvature)
  float cv = clamp(vCav, -1.0, 1.0);
  vec3 alb; float ao = mix(0.40, 1.06, smoothstep(0.0, 0.86, cv));
  if (vR <= 96 && vR > 0){ vec3 tc = (vec3(90.0 - vPos.x, vPos.y + 126.0, vPos.z + 72.0) - uLo + 0.5)/uDims; float dIn = textureLod(uB, tc, 0.0).g*25.0; ao *= 1.0 - 0.35*smoothstep(5.0, 14.0, dIn); }
  if (uLook == 2 || uLook == 3){ // scalp topography (EEG potential / MEG field)
    float v = 0.0;
    if (uLook == 2){ for (int i = 0; i < 10; i++){ if (i >= uNSrc) break; v += uSrcA[i]*gauss(vW, uSrc[i].xyz, uSrc[i].w); } }
    else { vec3 nr = normalize(vW - vec3(0.0, -18.0, 5.0)); for (int i = 0; i < 3; i++){ if (i >= uNDip) break; vec3 d = vW - uDip[i].xyz; float r = length(d); v += dot(cross(uDipQ[i].xyz, d), nr)/(r*r*r)*uDipQ[i].w; } }
    vec3 c = rdbu(v);
    float iso = abs(fract(v*5.0 + 0.5) - 0.5); float w = fwidth(v*5.0);
    c = mix(c, c*0.55, (1.0 - smoothstep(0.0, w*1.4, iso))*0.6);
    if (uShowElec == 1) for (int i = 0; i < 19; i++){ float d = length(vW - uElec[i]); if (d < 4.6){ c = mix(c, d < 3.4 ? vec3(0.98) : vec3(0.08), 1.0); } }
    o = vec4(c*(0.45 + 0.6*dif) + 0.12*spec, 1.0); return;
  }
  vec4 rc = texelFetch(uReg, ivec2(vR, 0), 0);
  if (uLook == 1){ alb = rc.rgb; }
  else {
    alb = vec3(0.93, 0.87, 0.85);
    if (vR >= 114 && vR <= 116) alb = vec3(0.88, 0.81, 0.80);
    if (vR == 113) alb = vec3(0.92, 0.89, 0.85);
    if ((vR >= 97 && vR <= 98) || vR >= 117) alb = vec3(0.35, 0.55, 1.0);
  }
  // sulcal fundi read slightly cooler and darker, crowns warm: the classic curvature look
  alb *= mix(vec3(0.78, 0.77, 0.84), vec3(1.03, 1.0, 0.98), smoothstep(0.0, 0.8, cv));
  vec3 col = alb*(0.20 + 0.84*dif*ao + 0.16*dif2*ao) + vec3(1.0)*spec*0.24*ao*smoothstep(-0.2, 0.8, cv);
  col = mix(col, vec3(0.42, 0.48, 0.56), fres*0.42);
  if (uLook == 1){
    if (vR == uSelR) col = mix(col, vec3(1.0, 0.9, 0.55), 0.35 + 0.15*sin(uTime*4.0));
    else if (vR == uHoverR) col = mix(col, vec3(1.0), 0.22);
  }
  if (uNAct > 0){
    float a = 0.0; for (int i = 0; i < 8; i++){ if (i >= uNAct) break; a += uActA[i]*gauss(vPos, uAct[i].xyz, uAct[i].w); }
    a *= uBold;
    col = mix(col, actCol(a)*(0.55 + 0.6*dif), smoothstep(0.24, 0.36, abs(a))*0.9);
  }
  if (uStim.w > 0.0){
    float d = length(vPos - uStim.xyz);
    float ring = exp(-pow(d - mod(uTime*28.0, 22.0), 2.0)/4.0)*(1.0 - smoothstep(4.0, 22.0, d));
    col = mix(col, vec3(1.0, 0.85, 0.35), clamp(exp(-d*d/10.0) + ring*0.6, 0.0, 1.0)*uStim.w);
  }
  o = vec4(col, 1.0);
}`;

/* =====================================================================
   Core app: loading, WebGL, camera, scans UI.
   ===================================================================== */
