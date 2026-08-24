const fs = require('fs');
const jpeg = require('jpeg-js');
const PNG = require('pngjs').PNG;

const inputJpg = 'C:\\Users\\MoaazYehia\\.gemini\\antigravity-ide\\brain\\4b2d9b61-eacf-432e-803b-ff7d2800d4eb\\ammar_cutout_1787523278441.jpg';
const outputPng = 'c:\\Users\\MoaazYehia\\OneDrive\\Desktop\\BURHAN\\images\\teachers\\ammar-yehia-cutout.png';

const rawJpeg = fs.readFileSync(inputJpg);
const jpegData = jpeg.decode(rawJpeg, { useTArray: true });

const width = jpegData.width;
const height = jpegData.height;
const png = new PNG({ width, height });

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (width * y + x) * 4;
    const r = jpegData.data[idx];
    const g = jpegData.data[idx + 1];
    const b = jpegData.data[idx + 2];

    // Distance from pure white / light gray checkerboard pattern
    const isBrightBackground = (r > 205 && g > 205 && b > 205) && (Math.abs(r - g) < 22 && Math.abs(g - b) < 22);
    const isEdgeArea = (r > 175 && g > 175 && b > 175) && (Math.abs(r - g) < 25 && Math.abs(g - b) < 25);

    if (isBrightBackground) {
      png.data[idx] = 0;
      png.data[idx + 1] = 0;
      png.data[idx + 2] = 0;
      png.data[idx + 3] = 0; // Completely transparent
    } else if (isEdgeArea) {
      // Soft transition for anti-aliased edge
      const brightness = (r + g + b) / 3;
      const alpha = Math.max(0, Math.min(255, Math.floor((255 - brightness) * 4.5)));
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = alpha;
    } else {
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255; // Full subject opacity
    }
  }
}

png.pack().pipe(fs.createWriteStream(outputPng)).on('finish', () => {
  console.log('Smoothed Transparent PNG created successfully at:', outputPng);
});
