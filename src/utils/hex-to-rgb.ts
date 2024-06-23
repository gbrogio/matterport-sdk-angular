export function hexToRgbPercent(hex: string) {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, '');

  // Parse the r, g, b values
  let bigint = parseInt(hex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  // Convert r, g, b to percentages
  let rPercent = (r / 255);
  let gPercent = (g / 255);
  let bPercent = (b / 255);

  return {
    r: rPercent,
    g: gPercent,
    b: bPercent
  };
}
