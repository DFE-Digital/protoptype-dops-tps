const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4174/teachers-pensions/',
    browserName: 'chromium',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node scripts/serve.js',
    url: 'http://127.0.0.1:4174/teachers-pensions/',
    env: { PORT: '4174', BASE_PATH: '/teachers-pensions' },
    reuseExistingServer: false
  }
});
