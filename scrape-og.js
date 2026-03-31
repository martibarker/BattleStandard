import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.goto('https://tow.whfb.app/army/orc-and-goblin-tribes', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for units to load
    await page.waitForSelector('.unit-card, [data-testid*="unit"], .army-unit', { timeout: 10000 }).catch(() => null);

    // Extract all unit data
    const units = await page.evaluate(() => {
      const unitList = [];

      // Look for unit containers
      const unitContainers = document.querySelectorAll('.unit-card, [class*="unit"], article, [role="article"]');

      unitContainers.forEach((container, idx) => {
        const text = container.innerText || container.textContent;
        const name = container.querySelector('h3, h2, [class*="title"], [class*="name"]')?.textContent?.trim();

        if (text && text.length > 20) {
          unitList.push({
            index: idx,
            name: name || 'Unknown',
            text: text.substring(0, 500)
          });
        }
      });

      return unitList;
    });

    console.log('Found units:');
    units.forEach(u => {
      console.log(`\n${u.name}:`);
      console.log(u.text);
      console.log('---');
    });

    if (units.length === 0) {
      console.log('No units found. Page body sample:');
      const sample = await page.content();
      console.log(sample.substring(0, 1000));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
