import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  const stage = process.argv[2] || 'before';
  const outDir = `/Users/sasi/.gemini/antigravity-ide/brain/b32b98ac-8ee5-49f1-859d-d2505ef9bce6/screenshots`;
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const routes = [
    { name: 'home', url: 'http://localhost:3000/' },
    { name: 'map', url: 'http://localhost:3000/map' },
    { name: 'investor', url: 'http://localhost:3000/investor' }
  ];

  for (const route of routes) {
    try {
      await page.goto(route.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const path = `${outDir}/${route.name}_${stage}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log(`Saved screenshot: ${path}`);
    } catch (e) {
      console.error(`Failed to screenshot ${route.name}:`, e);
    }
  }

  await browser.close();
})();
