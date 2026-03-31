import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    // Get the army page
    await page.goto('https://tow.whfb.app/army/orc-and-goblin-tribes', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait and extract composition/army list info
    await page.waitForSelector('h1, h2, h3, [class*="composition"], [class*="army"]', { timeout: 10000 }).catch(() => null);

    const compositions = await page.evaluate(() => {
      const results = [];
      
      // Try to find composition sections
      const headings = document.querySelectorAll('h1, h2, h3');
      headings.forEach(h => {
        const text = h.textContent.trim();
        if (text.toLowerCase().includes('army') || 
            text.toLowerCase().includes('composition') ||
            text.toLowerCase().includes('waaagh') ||
            text.toLowerCase().includes('horde')) {
          results.push({
            type: 'heading',
            text: text,
            level: h.tagName
          });
        }
      });
      
      return results;
    });

    console.log('Found composition-related sections:');
    console.log(JSON.stringify(compositions, null, 2));
    
    // Try another approach - look for navigation/menu items
    const navItems = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('a, button, [role="link"], [role="button"]').forEach(el => {
        const text = el.textContent.trim();
        if (text && (text.includes('army') || text.includes('composition') || text.includes('Waaagh') || text.includes('Horde'))) {
          items.push(text);
        }
      });
      return [...new Set(items)];
    });

    console.log('\nNavigation items mentioning armies/compositions:');
    console.log(JSON.stringify(navItems, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
