const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Set localStorage
  await page.goto('http://localhost:5173/login'); // Vite default port
  await page.evaluate(() => {
    localStorage.setItem('role', 'admin');
    localStorage.setItem('token', 'dummy_token');
  });
  
  await page.goto('http://localhost:5173/admin/messages');
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
