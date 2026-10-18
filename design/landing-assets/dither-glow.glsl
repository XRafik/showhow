/**
 * Showhow landing 1 — ordered dither glow (Bayer 8x8 over a soft radial field)
 * Quiet instrument: faint, static-feeling, sits behind the app window.
 */

/** @resolution */
uniform vec2 u_resolution;

/** @time */
uniform float u_time;

/**
 * @label Pixel size
 * @default 4
 * @range 2, 12
 */
uniform float u_px;

/**
 * @label Centre X
 * @default 0.5
 * @range 0, 1
 */
uniform float u_cx;

/**
 * @label Centre Y (0 = top)
 * @default 0.75
 * @range 0, 1
 */
uniform float u_cy;

/**
 * @label Width
 * @default 0.62
 * @range 0.1, 1.5
 */
uniform float u_rx;

/**
 * @label Height
 * @default 0.42
 * @range 0.1, 1.5
 */
uniform float u_ry;

/**
 * @label Strength
 * @default 0.55
 * @range 0, 1
 */
uniform float u_strength;

/**
 * @label Dot colour
 * @color
 * @default #82B09A
 */
uniform vec3 u_color;

/**
 * @label Dot opacity
 * @default 0.5
 * @range 0, 1
 */
uniform float u_alpha;

float b2(vec2 p){
  p = floor(mod(p, 2.0));
  return mod(p.x * 2.0 + p.y * 3.0, 4.0);
}

float bayer8(vec2 p){
  return (b2(p) * 16.0 + b2(floor(p / 2.0)) * 4.0 + b2(floor(p / 4.0))) / 64.0;
}

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 cell = floor(frag / u_px);
  vec2 uv = (cell + 0.5) * u_px / u_resolution;
  vec2 c = vec2(u_cx, u_cy);
  c.y = 1.0 - c.y;
  vec2 d = (uv - c) / vec2(u_rx, u_ry);
  float v = max(0.0, 1.0 - length(d));
  v = v * v * (3.0 - 2.0 * v);
  float breathe = 0.94 + 0.06 * sin(u_time * 0.6 + hash12(floor(cell / 14.0)) * 6.28);
  v *= u_strength * 2.0 * breathe;
  float on = step(bayer8(cell) + 0.5 / 64.0, v);
  float a = on * u_alpha;
  gl_FragColor = vec4(u_color * a, a);
}
