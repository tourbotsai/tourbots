// Renders each post defined in posts.json from its HTML template to a 1080x1080 PNG
// using Playwright/Chromium, so text, UI chrome and the logo are pixel-exact copies
// of real markup rather than AI-reinterpreted images.
//
// Usage: node render.mjs

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, 'templates');
const outputDir = path.join(__dirname, 'output');
const posts = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts.json'), 'utf-8'));

fs.mkdirSync(outputDir, { recursive: true });

function buildUrl(templateFile, params) {
  const filePath = path.join(templatesDir, templateFile);
  const url = new URL(`file://${filePath}`);
  for (const [key, value] of Object.entries(params)) {
    const serialised = typeof value === 'string' ? value : JSON.stringify(value);
    url.searchParams.set(key, serialised);
  }
  return url.toString();
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });

  for (const post of posts) {
    const url = buildUrl(post.template, post.params);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    const basePath = path.join(outputDir, post.id);
    // Same square crop serves both platforms; exported twice so each platform
    // gets its own clearly-labelled file to upload.
    await page.screenshot({ path: `${basePath}-ig.png` });
    fs.copyFileSync(`${basePath}-ig.png`, `${basePath}-linkedin.png`);

    console.log(`Rendered ${post.id} (${post.label})`);
  }

  await browser.close();
  console.log(`\nDone. ${posts.length} posts rendered to ${outputDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
