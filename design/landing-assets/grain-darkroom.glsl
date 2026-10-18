/**
 * Showhow landing 2 — darkroom grainient
 * Warped sage gradient in a graphite room, with film grain and a faint safelight ember.
 */

/** @resolution */
uniform vec2 u_resolution;

/** @time */
uniform float u_time;

/**
 * @label Grain
 * @default 0.16
 * @range 0, 0.5
 */
uniform float u_grain;

/**
 * @label Warp
 * @default 0.55
 * @range 0, 1.5
 */
uniform float u_warp;

/**
 * @label Glow height (0 = top)
 * @default 0.72
 * @range 0, 1
 */
uniform float u_gy;

/**
 * @label Room colour
 * @color
 * @default #161616
 */
uniform vec3 u_room;

/**
 * @label Deep sage
 * @color
 * @default #1F3A31
 */
uniform vec3 u_deep;

/**
 * @label Sage
 * @color
 * @default #82B09A
 */
uniform vec3 u_sage;

/**
 * @label Ember
 * @color
 * @default #E3582D
 */
uniform vec3 u_ember;

/**
 * @label Ember amount
 * @default 0.22
 * @range 0, 1
 */
uniform float u_emberAmt;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p){
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++){
    s += a * vnoise(p);
    p = p * 2.03 + 11.7;
    a *= 0.5;
  }
  return s;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = u_time * 0.05;
  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 + 5.2 - t));
  vec2 r = vec2(fbm(p * 1.8 + q * 2.0 + vec2(1.7, 9.2) + t * 1.4), fbm(p * 1.8 + q * 2.0 + vec2(8.3, 2.8)));
  vec2 w = p + (r - 0.5) * u_warp;

  vec2 c = vec2(0.5 * asp, 1.0 - u_gy);
  float d = length((w - c) * vec2(0.62, 1.0));
  float glow = smoothstep(0.85, 0.0, d);
  float core = smoothstep(0.42, 0.0, d);
  float band = fbm(w * 2.2 + r) ;

  vec3 col = u_room;
  col = mix(col, u_deep, glow * (0.55 + 0.6 * band));
  col = mix(col, u_sage, core * core * (0.35 + 0.65 * band) * 0.8);

  vec2 ec = vec2(0.06 * asp, 1.0);
  float ed = length((w - ec) * vec2(0.8, 1.0));
  col = mix(col, u_ember, smoothstep(0.55, 0.0, ed) * u_emberAmt);

  float vig = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(1.0, 1.15)));
  col *= 0.55 + 0.45 * vig;

  float frame = floor(u_time * 18.0);
  float g = hash12(gl_FragCoord.xy + frame * 17.0) - 0.5;
  float g2 = hash12(floor(gl_FragCoord.xy / 2.0) + frame * 5.0) - 0.5;
  col += (g * 0.7 + g2 * 0.5) * u_grain * (0.35 + 0.65 * (1.0 - core * 0.5));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
