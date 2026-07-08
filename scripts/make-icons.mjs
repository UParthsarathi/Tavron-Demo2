// Renders the PWA icon set into public/ from one SVG definition.
// Rerun after changing the mark: `node scripts/make-icons.mjs`
//
// The mark is the app's header logo: the lucide "hexagon" outline, drawn
// white on the app's dark surface (#0a0a0a). Pure paths only — sharp's SVG
// rasterizer has no fonts, so text would silently render blank.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const HEX_PATH =
  'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z';

/**
 * @param {object} opts
 * @param {number} opts.size      output pixels
 * @param {number} opts.pad       fraction of the canvas kept empty around the mark
 * @param {boolean} opts.dark     draw the dark background (false = transparent)
 * @param {number} opts.radius    corner radius as a fraction of size (ignored without bg)
 */
function markSvg({ size, pad, dark, radius = 0 }) {
  const inner = size * (1 - 2 * pad); // the 24x24 viewBox scaled into this box
  const scale = inner / 24;
  const offset = size * pad;
  const bg = dark
    ? `<rect width="${size}" height="${size}" rx="${size * radius}" fill="#0a0a0a"/>`
    : '';
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  ${bg}
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="${HEX_PATH}" fill="none" stroke="#ffffff" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`);
}

mkdirSync(new URL('../public/icons', import.meta.url), { recursive: true });
const out = (name) => new URL(`../public/${name}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

// Regular icons: dark rounded square, generous mark.
await sharp(markSvg({ size: 192, pad: 0.2, dark: true, radius: 0.188 })).png().toFile(out('icons/icon-192.png'));
await sharp(markSvg({ size: 512, pad: 0.2, dark: true, radius: 0.188 })).png().toFile(out('icons/icon-512.png'));
// Maskable: full-bleed square; mark inside the central safe zone.
await sharp(markSvg({ size: 512, pad: 0.28, dark: true, radius: 0 })).png().toFile(out('icons/icon-maskable-512.png'));
// Android notification badge: monochrome white on transparent.
await sharp(markSvg({ size: 96, pad: 0.08, dark: false })).png().toFile(out('icons/badge-96.png'));
// iOS home screen (iOS rounds the corners itself).
await sharp(markSvg({ size: 180, pad: 0.22, dark: true, radius: 0 })).png().toFile(out('apple-touch-icon.png'));

console.log('icons written to public/');
