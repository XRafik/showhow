/**
 * Showhow landing — scrub field
 * A field of timeline ticks whose heights follow a drifting waveform, one orange tick marking
 * the moment it went wrong. Built from the app's own scrub bar and audio lane.
 */

/** @resolution */
uniform vec2 u_resolution;

/** @time */
uniform float u_time;

/**
 * @label Tick pitch
 * @default 8
 * @range 4, 24
 */
uniform float u_pitch;

/**
 * @label Tick width
 * @default 2
 * @range 1, 6
 */
uniform float u_w;

/**
 * @label Max height (0 to 1)
 * @default 0.8
 * @range 0.1, 1
 */
uniform float u_amp;

/**
 * @label Mark position (0 to 1)
 * @default 0.62
 * @range 0, 1
 */
uniform float u_mark;

/**
 * @label Ink
 * @color
 * @default #2F2F2F
 */
uniform vec3 u_ink;

/**
 * @label Mark colour
 * @color
 * @default #E3582D
 */
uniform vec3 u_hot;

/**
 * @label Tick opacity
 * @default 0.28
 * @range 0, 1
 */
uniform float u_alpha;

float hash11(float p){
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float vn(float x){
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash11(i), hash11(i + 1.0), f);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float col = floor(frag.x / u_pitch);
  float cx = (col + 0.5) * u_pitch;
  float lx = frag.x - col * u_pitch;
  float inTick = step(abs(lx - u_pitch * 0.5), u_w * 0.5);

  float t = u_time * 0.35;
  float env = 0.25 + 0.75 * vn(col * 0.045 + t * 0.4);
  float det = 0.35 + 0.65 * vn(col * 0.9 + 3.0 + t);
  float h = clamp(env * det * u_amp, 0.03, 1.0);
  float mid = u_resolution.y * 0.5;
  float inside = step(abs(frag.y - mid), h * u_resolution.y * 0.5);

  float markCol = floor(u_mark * u_resolution.x / u_pitch);
  float isMark = step(abs(col - markCol), 0.5);
  float markInside = step(abs(frag.y - mid), u_resolution.y * 0.46);

  float a = inTick * inside * u_alpha;
  vec3 c = u_ink;
  if (isMark > 0.5){
    a = max(a, inTick * markInside);
    c = mix(c, u_hot, markInside);
  }
  gl_FragColor = vec4(c * a, a);
}
