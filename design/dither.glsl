/**
 * Showhow — ordered dither fill
 * Two-color Bayer 8x8 dithering over a blocky value field.
 * Modes: 0 = block field (panels, thumbnails) · 1 = progress (solid fill, dithered frontier) · 2 = fade right · 3 = fade up · 4 = fade down (capped at 75%)
 */

/** @resolution */
uniform vec2 u_resolution;

/**
 * @label Mode
 * @default 0
 * @range 0, 4
 */
uniform float u_mode;

/**
 * @label Pixel size
 * @default 4
 * @range 1, 24
 */
uniform float u_pixel;

/**
 * @label Block size
 * @default 26
 * @range 4, 200
 */
uniform float u_block;

/**
 * @label Lit color
 * @color
 * @default #CFE4DA
 */
uniform vec3 u_colA;

/**
 * @label Dark color
 * @color
 * @default #2F2F2F
 */
uniform vec3 u_colB;

/**
 * @label Accent color
 * @color
 * @default #82B09A
 */
uniform vec3 u_colC;

/**
 * @label Accent amount
 * @default 0.06
 * @range 0, 0.5
 */
uniform float u_accent;

/**
 * @label Gradient bias
 * @default 0.35
 * @range 0, 1
 */
uniform float u_gradient;

/**
 * @label Progress
 * @default 0.62
 * @range 0, 1
 */
uniform float u_progress;

/**
 * @label Frontier width
 * @default 28
 * @range 0, 200
 */
uniform float u_frontier;

/**
 * @label Seed
 * @default 7
 * @range 0, 100
 */
uniform float u_seed;

/**
 * @label Opacity
 * @default 1
 * @range 0, 1
 */
uniform float u_alpha;

float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float d = bayer8(frag / u_pixel);
  float v;

  if (u_mode > 0.5 && u_mode < 1.5) {
    float x = frag.x / u_resolution.x;
    float band = max(u_frontier, u_pixel) / u_resolution.x;
    v = clamp((u_progress - x) / band + 0.5, 0.0, 1.0);
  } else if (u_mode > 1.5 && u_mode < 2.5) {
    v = 1.0 - frag.x / u_resolution.x;
  } else if (u_mode > 2.5 && u_mode < 3.5) {
    v = frag.y / u_resolution.y;
  } else if (u_mode > 3.5) {
    v = (1.0 - frag.y / u_resolution.y) * 0.75;
  } else {
    vec2 bc = floor(frag / u_block);
    float n = hash12(bc + u_seed);
    float blocks = floor(n * 5.0) / 5.0;
    float g = (frag.x / u_resolution.x) * 0.55 + (1.0 - frag.y / u_resolution.y) * 0.45;
    v = mix(blocks, g, u_gradient);
  }

  float on = step(d, v) * step(0.001, v);

  if (u_mode > 1.5) {
    gl_FragColor = vec4(u_colA * on * u_alpha, on * u_alpha);
    return;
  }

  vec3 col = mix(u_colB, u_colA, on);
  if (u_mode < 0.5) {
    vec2 bc = floor(frag / u_block);
    float acc = step(1.0 - u_accent, hash12(bc + u_seed + 7.7));
    col = mix(col, u_colC, acc * 0.55);
  }
  gl_FragColor = vec4(col * u_alpha, u_alpha);
}
