import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Standard crisp SVG icon (for browser tabs, headers, any resolution)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141414"/>
      <stop offset="50%" stop-color="#0d0d0d"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="40%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="amberGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#d97706" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#333333" stop-opacity="0.3"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="url(#borderGrad)" stroke-width="4"/>

  <!-- Subtle grid lines -->
  <path d="M96 256h320M256 96v320" stroke="#262626" stroke-width="1.5" stroke-dasharray="6 6"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#222222" stroke-width="1.5"/>

  <!-- Anvil / Core Forge Crucible -->
  <g transform="translate(0, -6)">
    <!-- Ambient Glow behind core -->
    <path d="M156 220 L356 220 L320 310 L192 310 Z" fill="url(#amberGlow)" filter="url(#glow)"/>

    <!-- Anvil top bar -->
    <path d="M136 196 C136 186, 146 178, 158 178 L354 178 C366 178, 376 186, 376 196 L376 216 C376 226, 366 234, 354 234 L158 234 C146 234, 136 226, 136 216 Z" fill="url(#goldGrad)"/>

    <!-- Anvil waist & base -->
    <path d="M188 234 L212 320 L160 354 C152 360, 156 372, 168 372 L344 372 C356 372, 360 360, 352 354 L300 320 L324 234 Z" fill="#262626" stroke="#404040" stroke-width="3"/>

    <!-- Central Neural Spark / Diamond core -->
    <polygon points="256,128 274,166 312,172 284,198 292,236 256,216 220,236 228,198 200,172 238,166" fill="#fef3c7" filter="url(#glow)"/>
    <circle cx="256" cy="182" r="8" fill="#fbbf24"/>

    <!-- Geometric control vectors -->
    <line x1="210" y1="280" x2="302" y2="280" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
    <circle cx="256" cy="280" r="5" fill="#fef3c7"/>
    <line x1="228" y1="312" x2="284" y2="312" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
    <line x1="190" y1="344" x2="322" y2="344" stroke="#78716c" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`;

// Android Maskable SVG icon: essential artwork strictly within central 80% safe zone (circle r=204)
// and background bleeds completely to edges without rounded corners
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141414"/>
      <stop offset="50%" stop-color="#0c0c0c"/>
      <stop offset="100%" stop-color="#040404"/>
    </linearGradient>
    <linearGradient id="goldGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="40%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="amberGlowMask" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#d97706" stop-opacity="0.1"/>
    </linearGradient>
    <filter id="glowMask" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Full bleed background for Android masking -->
  <rect width="512" height="512" fill="url(#bgGradMask)"/>

  <!-- Centered safe-zone scaled artwork (scale 0.76 to ensure full safe padding) -->
  <g transform="translate(256, 256) scale(0.76) translate(-256, -256)">
    <!-- Concentric subtle telemetry rings -->
    <circle cx="256" cy="256" r="190" fill="none" stroke="#222222" stroke-width="2"/>
    <circle cx="256" cy="256" r="140" fill="none" stroke="#2a2a2a" stroke-width="1.5" stroke-dasharray="8 6"/>

    <!-- Ambient glow -->
    <path d="M156 220 L356 220 L320 310 L192 310 Z" fill="url(#amberGlowMask)" filter="url(#glowMask)"/>

    <!-- Anvil top bar -->
    <path d="M136 196 C136 186, 146 178, 158 178 L354 178 C366 178, 376 186, 376 196 L376 216 C376 226, 366 234, 354 234 L158 234 C146 234, 136 226, 136 216 Z" fill="url(#goldGradMask)"/>

    <!-- Anvil waist & base -->
    <path d="M188 234 L212 320 L160 354 C152 360, 156 372, 168 372 L344 372 C356 372, 360 360, 352 354 L300 320 L324 234 Z" fill="#262626" stroke="#404040" stroke-width="4"/>

    <!-- Central Spark -->
    <polygon points="256,128 274,166 312,172 284,198 292,236 256,216 220,236 228,198 200,172 238,166" fill="#fef3c7" filter="url(#glowMask)"/>
    <circle cx="256" cy="182" r="9" fill="#fbbf24"/>

    <!-- Geometric control vectors -->
    <line x1="210" y1="280" x2="302" y2="280" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
    <circle cx="256" cy="280" r="6" fill="#fef3c7"/>
    <line x1="228" y1="312" x2="284" y2="312" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

async function generate() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  console.log('Wrote public/icon.svg');

  // Standard 512x512 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Wrote public/pwa-512x512.png');

  // Standard 192x192 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Wrote public/pwa-192x192.png');

  // Maskable 512x512 PNG for Android launcher adaptive icons
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Wrote public/pwa-maskable-512x512.png');

  // Apple touch icon (180x180 PNG)
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Wrote public/apple-touch-icon.png');

  // Favicon 48x48 PNG and 32x32 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Wrote public/favicon.png');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
