const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = './assets';

async function convertSvgToPng(svgPath, outputPath, size) {
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  await sharp(Buffer.from(svgContent))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`Created: ${outputPath} (${size}x${size})`);
}

async function main() {
  // Convert logo-final.svg to icon.png (1024x1024)
  await convertSvgToPng(
    path.join(assetsDir, 'logo-final.svg'),
    path.join(assetsDir, 'icon.png'),
    1024
  );

  // Convert logo-final.svg to adaptive-icon.png (1024x1024)
  await convertSvgToPng(
    path.join(assetsDir, 'logo-final.svg'),
    path.join(assetsDir, 'adaptive-icon.png'),
    1024
  );

  // Convert favicon.svg to favicon.png (48x48)
  await convertSvgToPng(
    path.join(assetsDir, 'favicon.svg'),
    path.join(assetsDir, 'favicon.png'),
    48
  );

  // Also create splash-icon.png (1024x1024)
  await convertSvgToPng(
    path.join(assetsDir, 'logo-final.svg'),
    path.join(assetsDir, 'splash-icon.png'),
    1024
  );

  console.log('All logos converted successfully!');
}

main().catch(console.error);