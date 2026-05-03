const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.error('REQUEST FAILED:', request.url(), request.failure().errorText)
  );

  console.log('Navigating to http://localhost:5000...');
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });

  // Check if root has content
  const rootContent = await page.evaluate(() => {
    return document.getElementById('root') ? document.getElementById('root').innerHTML : 'No #root found';
  });

  console.log('Root HTML length:', rootContent.length);
  if (rootContent.includes('Loading Saathi AI...')) {
    console.log('Root still shows loading message.');
  }

  await browser.close();
})();
