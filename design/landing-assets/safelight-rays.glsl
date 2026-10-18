/**
 * Showhow landing — safelight rays
 * Slow sage beams fanning down from a point above the frame, in a graphite room.
 */

/** @resolution */
uniform vec2 u_resolution;

/** @time */
uniform float u_time;

/**
 * @label Source X
 * @default 0.5
 * @range 0, 1
 */
uniform float u_sx;

/**
 * @label Ray count
 * @default 9
 * @range 2, 24
 */
uniform float u_n;

/**
 * @label Reach
 * @default 1.1
 * @range 0.3, 2
 */
uniform float u_reach;

/**
 * @label Room
 * @color
 * @default #161616
 */
uniform vec3 u_room;

/**
 * @label Beam
 * @color
 * @default #82B09A
 */
uniform vec3 u_beam;

float hash11(float p){
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = vec2((uv.x - u_sx) * asp, uv.y - 1.08);
  float d = length(p);
  float a = atan(p.x, -p.y);
  float t = u_time * 0.12;
  float rays = 0.0;
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    float f = u_n * (1.0 + fi * 0.55);
    float ph = hash11(fi + 4.0) * 6.28;
    float s = 0.5 + 0.5 * sin(a * f + ph + t * (1.0 + fi));
    rays += pow(s, 5.0) * (0.55 - fi * 0.14);
  }
  float fall = smoothstep(u_reach, 0.0, d);
  float edge = smoothstep(1.1, 0.35, abs(a));
  float v = rays * fall * edge;
  vec3 col = u_room + u_beam * v * 0.42;
  col += (hash11(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + floor(u_time * 12.0)) - 0.5) * 0.04;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
