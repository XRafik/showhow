/**
 * Showhow — pixelate effect
 * Mosaics the node's own rendering. Used for redacted / sensitive text.
 */

/** @resolution */
uniform vec2 u_resolution;

/** @content */
uniform sampler2D u_content;

/**
 * @label Pixel size
 * @default 6
 * @range 1, 48
 */
uniform float u_pixel;

void main(){
  vec2 cell = (floor(gl_FragCoord.xy / u_pixel) + 0.5) * u_pixel;
  gl_FragColor = texture2D(u_content, cell / u_resolution);
}
