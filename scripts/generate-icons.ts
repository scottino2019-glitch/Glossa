import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width: number, height: number, bgColor: [number, number, number], glyph: string, fgColor: [number, number, number]) {
  // Construct a minimal uncompressed/zlib PNG
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width(4), height(4), bitDepth(1)=8, colorType(1)=6 (RGBA), comp(1)=0, filter(1)=0, interlace(1)=0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: height rows, each with 1 filter byte (0) + width * 4 bytes RGBA
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;
  const innerRadius = width * 0.38;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded dark background or card shape
      const isInBorder = dist <= radius && dist >= innerRadius;
      const isInInner = dist < innerRadius;

      // Draw a stylized book / glyph "語" / "文" or clean geometric letter in center
      const inCenterBar = Math.abs(dx) < width * 0.08 && Math.abs(dy) < height * 0.22;
      const inCrossBar = Math.abs(dy) < height * 0.05 && Math.abs(dx) < width * 0.22;
      const inAccentDot = Math.abs(dx) < width * 0.06 && Math.abs(dy + height * 0.25) < height * 0.06;

      if (inCenterBar || inCrossBar || inAccentDot) {
        rawData[pxOffset] = fgColor[0];
        rawData[pxOffset + 1] = fgColor[1];
        rawData[pxOffset + 2] = fgColor[2];
        rawData[pxOffset + 3] = 255;
      } else if (isInBorder) {
        rawData[pxOffset] = Math.min(255, bgColor[0] + 50);
        rawData[pxOffset + 1] = Math.min(255, bgColor[1] + 50);
        rawData[pxOffset + 2] = Math.min(255, bgColor[2] + 50);
        rawData[pxOffset + 3] = 255;
      } else if (dist <= radius) {
        rawData[pxOffset] = bgColor[0];
        rawData[pxOffset + 1] = bgColor[1];
        rawData[pxOffset + 2] = bgColor[2];
        rawData[pxOffset + 3] = 255;
      } else {
        // Outside circle for maskable or transparent for non-maskable
        rawData[pxOffset] = bgColor[0];
        rawData[pxOffset + 1] = bgColor[1];
        rawData[pxOffset + 2] = bgColor[2];
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Simple CRC32 for PNG chunks
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="104" fill="#181b20"/>
  <circle cx="256" cy="256" r="210" stroke="#2d323b" stroke-width="4"/>
  <!-- Elegant layered character / leaf / study glyph -->
  <path d="M256 120V392M160 210H352M180 320L332 320" stroke="#f0f2f5" stroke-width="28" stroke-linecap="round"/>
  <circle cx="256" cy="150" r="14" fill="#60a5fa"/>
  <!-- Subdued language badges accents in safe zone -->
  <circle cx="160" cy="160" r="10" fill="#e06c75"/>
  <circle cx="352" cy="160" r="10" fill="#98c379"/>
  <circle cx="160" cy="360" r="10" fill="#e5c07b"/>
  <circle cx="352" cy="360" r="10" fill="#c678dd"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// Generate 192x192, 512x512, maskable, apple-touch-icon
const darkBg: [number, number, number] = [24, 27, 32];
const lightFg: [number, number, number] = [240, 242, 245];

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, darkBg, 'G', lightFg));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, darkBg, 'G', lightFg));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, darkBg, 'G', lightFg));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, darkBg, 'G', lightFg));

console.log('Icons successfully generated in public/');
