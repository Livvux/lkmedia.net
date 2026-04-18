import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const URL = 'https://klavierbau-milde.de';
const browser = await chromium.launch();

// Desktop 2x retina
const dp = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await dp.goto(URL, { waitUntil: 'load', timeout: 20000 });
await dp.waitForTimeout(3000);
await dp.screenshot({ path: '/tmp/desktop.png' });
await dp.close();

// Mobile (iPhone 14 size)
const mp = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await mp.goto(URL, { waitUntil: 'load', timeout: 20000 });
await mp.waitForTimeout(3000);
await mp.screenshot({ path: '/tmp/mobile.png' });
await mp.close();
await browser.close();
console.log('screenshots captured');

// Build composite: black canvas, MacBook with screen area, iPhone in front right
const W = 1920, H = 1200;
const lapW = 1400, lapH = 875;      // MacBook outer (screen + bezel)
const lapX = Math.floor((W - lapW) / 2) - 80;
const lapY = 110;
const bezel = 24;
const screenW = lapW - bezel*2;
const screenH = lapH - bezel*2;

const desktopScreen = await sharp('/tmp/desktop.png')
  .resize(screenW, screenH, { fit: 'cover', position: 'top' })
  .toBuffer();

// Rounded screen corners via SVG mask
const screenMask = Buffer.from(`<svg width="${screenW}" height="${screenH}"><rect x="0" y="0" width="${screenW}" height="${screenH}" rx="8" ry="8" fill="#fff"/></svg>`);
const desktopRounded = await sharp(desktopScreen).composite([{ input: screenMask, blend: 'dest-in' }]).png().toBuffer();

// MacBook frame: rounded dark rectangle + notch + base
const macBodySvg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mac" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#2a2a2d"/>
      <stop offset="1" stop-color="#111"/>
    </linearGradient>
    <linearGradient id="base" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#3a3a3d"/>
      <stop offset="1" stop-color="#1a1a1d"/>
    </linearGradient>
  </defs>
  <!-- MacBook screen body -->
  <rect x="${lapX}" y="${lapY}" width="${lapW}" height="${lapH}" rx="18" fill="url(#mac)"/>
  <!-- Camera notch -->
  <circle cx="${lapX + lapW/2}" cy="${lapY + 12}" r="3" fill="#0a0a0a"/>
  <!-- Base -->
  <path d="M ${lapX-60} ${lapY+lapH+4} L ${lapX+lapW+60} ${lapY+lapH+4} L ${lapX+lapW+20} ${lapY+lapH+38} L ${lapX-20} ${lapY+lapH+38} Z" fill="url(#base)"/>
  <!-- Indent -->
  <rect x="${lapX + lapW/2 - 60}" y="${lapY+lapH+4}" width="120" height="6" rx="3" fill="#0a0a0a"/>
</svg>`;

// iPhone
const phW = 280, phH = 572;
const phX = lapX + lapW - 40;
const phY = lapY + lapH - phH + 120;
const phBezel = 14;
const phScreenW = phW - phBezel*2;
const phScreenH = phH - phBezel*2;
const mobileScreen = await sharp('/tmp/mobile.png').resize(phScreenW, phScreenH, { fit: 'cover', position: 'top' }).toBuffer();
const phMask = Buffer.from(`<svg width="${phScreenW}" height="${phScreenH}"><rect x="0" y="0" width="${phScreenW}" height="${phScreenH}" rx="22" ry="22" fill="#fff"/></svg>`);
const mobileRounded = await sharp(mobileScreen).composite([{ input: phMask, blend: 'dest-in' }]).png().toBuffer();

const phBodySvg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ph" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#1c1c1e"/>
      <stop offset="1" stop-color="#000"/>
    </linearGradient>
  </defs>
  <rect x="${phX}" y="${phY}" width="${phW}" height="${phH}" rx="36" fill="url(#ph)" stroke="#2a2a2d" stroke-width="2"/>
</svg>`;

const canvas = sharp({ create: { width: W, height: H, channels: 4, background: { r:0,g:0,b:0,alpha:0 }}});
const out = await canvas.composite([
  { input: Buffer.from(macBodySvg), top: 0, left: 0 },
  { input: desktopRounded, top: lapY + bezel, left: lapX + bezel },
  { input: Buffer.from(phBodySvg), top: 0, left: 0 },
  { input: mobileRounded, top: phY + phBezel, left: phX + phBezel },
]).png().toBuffer();

await fs.writeFile('public/landing/device.png', out);
await sharp(out).webp({ quality: 85 }).toFile('public/landing/device.webp');
console.log('wrote public/landing/device.png + device.webp');
