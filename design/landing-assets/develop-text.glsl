/**
 * Showhow landing 3 — develop text (shader effect)
 * Letters break from sharp type into ragged mosaic blocks, left to right (the undeveloped end). The product's own
 * "develop" moment applied to the headline.
 */

/** @resolution */
uniform vec2 u_resolution;

/** @content */
uniform sampler2D u_content;

/**
 * @label Block size
 * @default 14
 * @range 4, 40
 */
uniform float u_block;

/**
 * @label Sweep start (x position where mosaic begins, 0 to 1)
 * @default 0.35
 * @range 0, 1
 */
uniform float u_sweep;

/**
 * @label Sweep softness
 * @default 0.5
 * @range 0.05, 1
 */
uniform float u_soft;

/**
 * @label Ink
 * @color
 * @default #1F1F1F
 */
uniform vec3 u_ink;

/**
 * @label Hot block colour
 * @color
 * @default #E3582D
 */
uniform vec3 u_hot;

/**
 * @label Hot block share
 * @default 0.14
 * @range 0, 1
 */
uniform float u_hotShare;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_resolution;
  vec4 sharp = texture2D(u_content, uv);

  vec2 bc = floor(frag / u_block);
  float m = smoothstep(u_sweep, u_sweep + u_soft, uv.x);
  float useMosaic = step(hash12(bc + 7.0) * 0.98, m);

  float cov = 0.0;
  for (int i = 0; i < 4; i++){
    for (int j = 0; j < 4; j++){
      vec2 o = (vec2(float(i), float(j)) + 0.5) / 4.0;
      vec2 sp = (bc + o) * u_block / u_resolution;
      cov += texture2D(u_content, sp).a;
    }
  }
  cov /= 16.0;
  float n = hash12(bc + 21.0);
  float q = clamp(floor(cov * 4.0 + n * 0.75 + 0.15) / 4.0, 0.0, 1.0);
  vec3 col = mix(u_ink, u_hot, step(1.0 - u_hotShare, hash12(bc + 55.0)) * step(0.25, q));
  vec4 mosaic = vec4(col * q, q);

  gl_FragColor = mix(sharp, mosaic, useMosaic);
}
