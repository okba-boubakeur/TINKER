const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { default: pngToIco } = require('png-to-ico');

const svgPath = path.join(__dirname, '..', 'icon.svg');
const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');
const publicDir = path.join(__dirname, '..', 'public');

async function main() {
  const svgBuffer = fs.readFileSync(svgPath);

  // Ensure public dir exists
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // Web favicon
  fs.copyFileSync(svgPath, path.join(publicDir, 'favicon.svg'));
  console.log('Copied favicon.svg to public/');

  // Tauri PNG icons
  const sizes = [
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
    { name: 'Square30x30Logo.png', size: 30 },
    { name: 'Square44x44Logo.png', size: 44 },
    { name: 'Square71x71Logo.png', size: 71 },
    { name: 'Square89x89Logo.png', size: 89 },
    { name: 'Square107x107Logo.png', size: 107 },
    { name: 'Square142x142Logo.png', size: 142 },
    { name: 'Square150x150Logo.png', size: 150 },
    { name: 'Square284x284Logo.png', size: 284 },
    { name: 'Square310x310Logo.png', size: 310 },
    { name: 'StoreLogo.png', size: 50 },
    { name: 'icon.png', size: 256 },
  ];

  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(iconsDir, name));
    console.log(`Generated ${name} (${size}x${size})`);
  }

  // Windows ICO (multi-size)
  const icoSizes = [16, 32, 48, 256];
  const icoBuffers = [];
  for (const s of icoSizes) {
    const buf = await sharp(svgBuffer)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    icoBuffers.push(buf);
  }
  const icoBuffer = await pngToIco(icoBuffers);
  fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);
  console.log('Generated icon.ico');

  console.log('All icons generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
