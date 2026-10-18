/**
 * Showhow landing 3 — click ripple field
 * Rings of mosaic blocks travel outward from the click point (the Download button).
 * The first ring is the click ring: orange. Beyond it, blocks "develop" into lit sage.
 */

/** @resolution */
uniform vec2 u_resolution;

/** @time */
uniform float u_time;

/**
 * @label Click X
 * @default 0.5
 * @range 0, 1
 */
uniform float u_cx;

/**
 * @label Click Y (0 = top)
 * @default 0.5
 * @range 0, 1
 */
uniform float u_cy;

/**
 * @label Block size
 * @default 24
 * @range 6, 80
 */
uniform float u_block;

/**
 * @label Ring spacing
 * @default 190
 * @range 40, 500
 */
uniform float u_gap;

/**
 * @label Ring width
 * @default 46
 * @range 8, 200
 */
uniform float u_width;

/**
 * @label Travel speed
 * @default 22
 * @range 0, 120
 */
uniform float u_speed;

/**
 * @label Dot pitch
 * @default 4
 * @range 2, 12
 */
uniform float u_dot;

/**
 * @label Base colour
 * @color
 * @default #82B09A
 */
uniform vec3 u_base;

/**
 * @label Lit colour
 * @color
 * @default #E7F1EC
 */
uniform vec3 u_lit;

/**
 * @label Shade colour
 * @color
 * @default #4F7C68
 */
uniform vec3 u_shade;

/**
 * @label Click colour
 * @color
 * @default #E3582D
 */
uniform vec3 u_click;

/**
 * @label Calm zone (centre x, centre y, half w, half h) in px from the top-left
 * @default 720, 330, 520, 220
 */
uniform vec4 u_calm;

/**
 * @label Calm zone softness
 * @default 110
 * @range 1, 300
 */
uniform float u_calmSoft;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 c = vec2(u_cx, 1.0 - u_cy) * u_resolution;
  vec2 bc = floor(frag / u_block);
  vec2 bp = (bc + 0.5) * u_block;
  float d = length(bp - c);
  float phase = mod(u_time * u_speed, u_gap);

  float lit = 0.0;
  float hot = 0.0;
  for (int k = 0; k < 9; k++){
    float fk = float(k);
    float rr = fk * u_gap + phase;
    float band = exp(-pow((d - rr) / u_width, 2.0));
    float fade = 1.0 / (1.0 + fk * 0.55);
    lit = max(lit, band * fade);
    if (k == 0) hot = band;
  }
  vec2 cp = vec2(bp.x, u_resolution.y - bp.y) - u_calm.xy;
  vec2 q = abs(cp) - u_calm.zw;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float away = smoothstep(0.0, u_calmSoft, sd);
  lit *= away;
  hot *= away;
  float n = hash12(bc + 3.0);
  float n2 = hash12(floor(bc / 2.0) + 9.0);
  float v = lit * 1.15 - (n * 0.7 + n2 * 0.5) * 0.55;
  float onLit = step(0.12, v);
  float onShade = step(0.5, hash12(bc + 41.0)) * step(0.05, lit * 0.9 + n * 0.1 - 0.1) * (1.0 - onLit);
  float onHot = step(0.35, hot * 1.2 - n * 0.55) * step(d, u_gap * 0.62 + phase);

  vec3 col = u_base;
  col = mix(col, u_shade, onShade);
  col = mix(col, u_lit, onLit);
  col = mix(col, u_click, onHot);

  vec2 dc = fract(frag / u_dot) - 0.5;
  float dotMask = 1.0 - smoothstep(0.16, 0.3, length(dc));
  vec3 against = (onLit + onHot) > 0.5 ? u_shade : u_lit;
  float edge = max(onLit, max(onShade, onHot));
  col = mix(col, against, dotMask * 0.22 * edge);

  gl_FragColor = vec4(col, 1.0);
}
