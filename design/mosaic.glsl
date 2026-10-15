/**
 * Showhow — mosaic halftone fill
 * Ragged block mosaic that dissolves lit → dark, overprinted with a fine dot screen.
 * Direction: 0 = lit left, 1 = lit top, 2 = lit centre, 3 = lit right
 */

/** @resolution */
uniform vec2 u_resolution;

/**
 * @label Direction
 * @default 0
 * @range 0, 3
 */
uniform float u_dir;

/**
 * @label Block size
 * @default 28
 * @range 4, 160
 */
uniform float u_block;

/**
 * @label Dot pitch
 * @default 4
 * @range 2, 16
 */
uniform float u_dot;

/**
 * @label Edge position
 * @default 0.5
 * @range 0, 1
 */
uniform float u_edge;

/**
 * @label Edge softness
 * @default 0.35
 * @range 0.02, 1
 */
uniform float u_soft;

/**
 * @label Roughness
 * @default 0.55
 * @range 0, 1
 */
uniform float u_rough;

/**
 * @label Lit color
 * @color
 * @default #CFE4DA
 */
uniform vec3 u_lit;

/**
 * @label Dark color
 * @color
 * @default #242424
 */
uniform vec3 u_dark;

/**
 * @label Dot strength
 * @default 0.35
 * @range 0, 1
 */
uniform float u_dots;

/**
 * @label Seed
 * @default 3
 * @range 0, 100
 */
uniform float u_seed;

/**
 * @label Opacity
 * @default 1
 * @range 0, 1
 */
uniform float u_alpha;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_resolution;
  vec2 bc = floor(frag / u_block);
  vec2 buv = (bc + 0.5) * u_block / u_resolution;

  float t;
  if (u_dir < 0.5) t = buv.x;
  else if (u_dir < 1.5) t = 1.0 - buv.y;
  else if (u_dir < 2.5) t = length((buv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0)) * 1.4;
  else t = 1.0 - buv.x;

  float n = hash12(bc + u_seed) - 0.5;
  float n2 = hash12(floor(bc / 2.0) + u_seed + 17.0) - 0.5;
  float v = (u_edge - t) / u_soft + 0.5 + (n * 0.8 + n2 * 0.6) * u_rough * 2.0;
  v = clamp(v, 0.0, 1.0);
  v = floor(v * 5.0 + 0.5) / 5.0;

  vec3 base = mix(u_dark, u_lit, v);
  vec2 dc = fract(frag / u_dot) - 0.5;
  float dotMask = 1.0 - smoothstep(0.18, 0.3, length(dc));
  vec3 against = v > 0.5 ? u_dark : u_lit;
  vec3 col = mix(base, against, dotMask * u_dots * (0.35 + 0.65 * abs(v - 0.5) * 2.0));
  gl_FragColor = vec4(col * u_alpha, u_alpha);
}
