const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ASSETS = path.join(__dirname, "..", "assets");
const SVG = path.join(ASSETS, "icon.svg");

async function main() {
  console.log("=== Building icons from SVG ===\n");

  // 1. Generate multi-size PNGs
  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];

  for (const size of sizes) {
    const buf = await sharp(SVG).resize(size, size).png().toBuffer();
    pngBuffers.push({ size, buf });
    console.log(`  PNG ${size}x${size} generated`);
  }

  // 2. Create ICO manually
  const icoBuffer = createIco(pngBuffers);
  fs.writeFileSync(path.join(ASSETS, "icon.ico"), icoBuffer);
  console.log("\n  icon.ico created (multi-size)\n");

  // 3. Tray icon (32x32 PNG)
  await sharp(SVG).resize(32, 32).png().toFile(path.join(ASSETS, "tray-icon.png"));
  console.log("  tray-icon.png (32x32) created\n");

  // 4. NSIS Installer sidebar BMP (164x314)
  const sideW = 164, sideH = 314;
  const sidebarSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sideW}" height="${sideH}">
    <defs>
      <linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e1f22"/>
        <stop offset="60%" stop-color="#2b2d31"/>
        <stop offset="100%" stop-color="#5865f2"/>
      </linearGradient>
    </defs>
    <rect width="${sideW}" height="${sideH}" fill="url(#sbg)"/>
    <text x="${sideW/2}" y="240" text-anchor="middle" font-family="Segoe UI,sans-serif" font-size="16" font-weight="700" fill="#dbdee1">로또 추천기</text>
    <text x="${sideW/2}" y="262" text-anchor="middle" font-family="Segoe UI,sans-serif" font-size="11" fill="#949ba4">Lotto Recommender</text>
    <text x="${sideW/2}" y="290" text-anchor="middle" font-family="Segoe UI,sans-serif" font-size="10" fill="#6d6f78">v2.3.1</text>
  </svg>`;

  const sidebarBase = await sharp(Buffer.from(sidebarSvg)).png().toBuffer();
  const iconSmall = await sharp(SVG).resize(80, 80).png().toBuffer();

  // Composite icon onto sidebar, then convert to raw RGBA
  const composited = await sharp(sidebarBase)
    .composite([{ input: iconSmall, left: Math.floor((sideW - 80) / 2), top: 80 }])
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bmpBuf = createBmp(composited.data, sideW, sideH);
  fs.writeFileSync(path.join(ASSETS, "installer-sidebar.bmp"), bmpBuf);
  console.log("  installer-sidebar.bmp (164x314) created\n");

  console.log("=== All icons generated! ===");
}

// Create ICO file from PNG buffers
function createIco(images) {
  const count = images.length;
  const headerSize = 6 + count * 16; // ICO header + directory entries
  let offset = headerSize;

  // Build directory entries
  const entries = images.map(({ size, buf }) => {
    const entry = {
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      dataSize: buf.length,
      offset: offset,
      buf,
    };
    offset += buf.length;
    return entry;
  });

  const totalSize = offset;
  const ico = Buffer.alloc(totalSize);

  // ICO header
  ico.writeUInt16LE(0, 0);     // reserved
  ico.writeUInt16LE(1, 2);     // type: 1 = ICO
  ico.writeUInt16LE(count, 4); // image count

  // Directory entries
  entries.forEach((e, i) => {
    const pos = 6 + i * 16;
    ico.writeUInt8(e.width, pos);
    ico.writeUInt8(e.height, pos + 1);
    ico.writeUInt8(0, pos + 2);   // color palette
    ico.writeUInt8(0, pos + 3);   // reserved
    ico.writeUInt16LE(1, pos + 4); // color planes
    ico.writeUInt16LE(32, pos + 6); // bits per pixel
    ico.writeUInt32LE(e.dataSize, pos + 8);
    ico.writeUInt32LE(e.offset, pos + 12);
  });

  // Image data
  entries.forEach((e) => {
    e.buf.copy(ico, e.offset);
  });

  return ico;
}

// Create 24-bit BMP from raw RGBA buffer
function createBmp(rawRgba, width, height) {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  const buf = Buffer.alloc(fileSize);

  buf.write("BM", 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);

  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelDataSize, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * 4;
    const dstRow = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const si = srcRow + x * 4;
      const di = dstRow + x * 3;
      const a = rawRgba[si + 3] / 255;
      buf[di + 0] = Math.round(rawRgba[si + 2] * a);
      buf[di + 1] = Math.round(rawRgba[si + 1] * a);
      buf[di + 2] = Math.round(rawRgba[si + 0] * a);
    }
  }

  return buf;
}

main().catch(console.error);
