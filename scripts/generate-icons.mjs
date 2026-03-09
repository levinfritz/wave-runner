#!/usr/bin/env node
// Generates PWA icon PNGs without external dependencies
import { writeFileSync } from 'fs';

// Minimal PNG encoder (uncompressed, RGBA)
function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }
  const zlibData = deflateStored(rawData);
  const idatChunk = makeChunk('IDAT', zlibData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeB, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput) >>> 0, 0);
  return Buffer.concat([len, typeB, data, crc]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  return c ^ 0xffffffff;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}

function deflateStored(data) {
  const header = Buffer.from([0x78, 0x01]);
  const maxBlock = 65535;
  const blocks = [];
  for (let i = 0; i < data.length; i += maxBlock) {
    const end = Math.min(i + maxBlock, data.length);
    const isLast = end >= data.length;
    const blockData = data.subarray(i, end);
    const blockLen = blockData.length;
    const blockHeader = Buffer.alloc(5);
    blockHeader[0] = isLast ? 0x01 : 0x00;
    blockHeader.writeUInt16LE(blockLen, 1);
    blockHeader.writeUInt16LE(blockLen ^ 0xffff, 3);
    blocks.push(blockHeader, blockData);
  }
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) { a = (a + data[i]) % 65521; b = (b + a) % 65521; }
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(((b << 16) | a) >>> 0, 0);
  return Buffer.concat([header, ...blocks, checksum]);
}

// Color helpers
function lerp(a, b, t) { return a + (b - a) * t; }

function setPixel(pixels, size, x, y, r, g, b, a) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const idx = (y * size + x) * 4;
  // Alpha compositing (source over)
  const srcA = a / 255;
  const dstA = pixels[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return;
  pixels[idx] = Math.round((r * srcA + pixels[idx] * dstA * (1 - srcA)) / outA);
  pixels[idx + 1] = Math.round((g * srcA + pixels[idx + 1] * dstA * (1 - srcA)) / outA);
  pixels[idx + 2] = Math.round((b * srcA + pixels[idx + 2] * dstA * (1 - srcA)) / outA);
  pixels[idx + 3] = Math.round(outA * 255);
}

function generateIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.48;
  const innerR = size * 0.45;
  const edgeSoft = size * 0.02; // soft AA edge

  // Pass 1: Dark background fill for entire icon area (rounded square feel)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= outerR + edgeSoft) {
        // Shadow ring (subtle dark glow around the circle)
        if (dist > innerR) {
          const shadowAlpha = Math.max(0, 1 - (dist - innerR) / (outerR + edgeSoft - innerR));
          setPixel(pixels, size, x, y, 5, 0, 20, Math.round(shadowAlpha * 80));
        }
      }
    }
  }

  // Pass 2: Main circle with gradient
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= innerR + 1.5) {
        // Diagonal gradient: #4488ff (top-left) → #aa44ff (bottom-right)
        const t = Math.min(1, Math.max(0, (x + y) / (size * 2)));
        const red = Math.round(lerp(0x44, 0xaa, t));
        const green = Math.round(lerp(0x88, 0x44, t));
        const blue = 0xff;

        // Subtle radial highlight (inner light)
        const highlightDist = Math.sqrt((x - cx * 0.8) ** 2 + (y - cy * 0.7) ** 2);
        const highlight = Math.max(0, 1 - highlightDist / (innerR * 0.8));
        const hr = Math.min(255, red + Math.round(highlight * 40));
        const hg = Math.min(255, green + Math.round(highlight * 40));
        const hb = Math.min(255, blue);

        // Smooth AA edge
        const aa = dist > innerR - 1.5 ? Math.max(0, Math.min(1, (innerR + 1.5 - dist) / 3)) : 1;
        setPixel(pixels, size, x, y, hr, hg, hb, Math.round(aa * 255));
      }
    }
  }

  // Pass 3: Wave pattern (thick anti-aliased lines)
  const lineW = Math.max(3, Math.round(size * 0.035));
  const startX = Math.round(size * 0.28);
  const midY = Math.round(size * 0.56);
  const amp = Math.round(size * 0.11);
  const segW = Math.round(size * 0.13);

  const points = [
    [startX, midY],
    [startX + segW, midY - amp],
    [startX + segW * 2, midY],
    [startX + segW * 3, midY - amp]
  ];

  for (let s = 0; s < points.length - 1; s++) {
    const [x0, y0] = points[s];
    const [x1, y1] = points[s + 1];
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 3;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x0 + (x1 - x0) * t;
      const py = y0 + (y1 - y0) * t;
      // Anti-aliased circle at each sample
      const drawR = lineW + 1;
      for (let dy = -drawR; dy <= drawR; dy++) {
        for (let dx = -drawR; dx <= drawR; dx++) {
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d <= lineW + 1) {
            const ix = Math.round(px + dx);
            const iy = Math.round(py + dy);
            const cdist = Math.sqrt((ix - cx) ** 2 + (iy - cy) ** 2);
            if (cdist <= innerR) {
              const aa = d > lineW - 1 ? Math.max(0, (lineW + 1 - d) / 2) : 1;
              setPixel(pixels, size, ix, iy, 255, 255, 255, Math.round(aa * 245));
            }
          }
        }
      }
    }
  }

  // Round line caps
  for (const [px, py] of [points[0], points[points.length - 1]]) {
    const capR = lineW + 1;
    for (let dy = -capR; dy <= capR; dy++) {
      for (let dx = -capR; dx <= capR; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= lineW + 1) {
          const ix = Math.round(px + dx);
          const iy = Math.round(py + dy);
          const cdist = Math.sqrt((ix - cx) ** 2 + (iy - cy) ** 2);
          if (cdist <= innerR) {
            const aa = d > lineW - 1 ? Math.max(0, (lineW + 1 - d) / 2) : 1;
            setPixel(pixels, size, ix, iy, 255, 255, 255, Math.round(aa * 245));
          }
        }
      }
    }
  }

  return createPNG(size, size, pixels);
}

writeFileSync('public/icon-192.png', generateIcon(192));
writeFileSync('public/icon-512.png', generateIcon(512));
console.log('PWA icons generated: public/icon-192.png, public/icon-512.png');
