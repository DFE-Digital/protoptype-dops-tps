const { test, expect } = require('@playwright/test');

const email = 'any email';
const password = 'x';
const journeyNames = ['login', 'migrated', 'password', 'email', 'twofactor', 'registration'];

async function submit(page, text = 'Continue') {
  await page.getByRole('button', { name: text, exact: true }).click();
}

async function fillDate(page, prefix, parts) {
  for (const [index, part] of ['day', 'month', 'year'].entries()) {
    await page.locator(`#${prefix}-${part}`).fill(parts[index]);
  }
}

async function settings(page, { risk = true, attempts = '0', active = true, records = true, securityResult = 'pass' } = {}) {
  await page.goto('./#/scenarios');
  await page.locator(`input[name="risk"][value="${risk ? 'on' : 'off'}"]`).check();
  await page.locator(`input[name="attempts"][value="${attempts}"]`).check();
  await page.locator(`input[name="active"][value="${active ? 'yes' : 'no'}"]`).check();
  await page.locator(`input[name="records"][value="${records ? 'yes' : 'no'}"]`).check();
  await page.locator(`input[name="securityResult"][value="${securityResult}"]`).check();
  await submit(page, 'Save scenario');
  await expect(page.getByRole('status')).toContainText('Scenario saved');
}

async function identify(page, journey) {
  await page.goto(`./#/start/${journey}`);
  if (journey === 'email') {
    await page.getByLabel('Teachers’ reference number (TRN)', { exact: true }).fill('any TRN');
    await page.getByLabel('Last name', { exact: true }).fill('Any name');
    await fillDate(page, 'dob', ['day', 'month', 'year']);
  } else {
    await page.getByLabel('Email address', { exact: true }).fill(email);
    if (journey === 'migrated') await page.getByLabel('Teachers’ reference number (TRN)', { exact: true }).fill('any TRN');
  }
  await submit(page);
}

async function reachSecurity(page, journey) {
  await identify(page, journey);
  for (let count = 0; count < 4; count++) {
    if (page.url().endsWith('/password')) {
      await page.getByLabel('Password', { exact: true }).fill(password);
    } else if (page.url().endsWith('/code') || page.url().endsWith('/second-factor')) {
      await page.getByLabel('Verification code', { exact: true }).fill('any code');
    } else if (page.url().endsWith('/identity')) {
      await page.getByLabel('Last name', { exact: true }).fill('Any name');
      await page.getByLabel('National Insurance number', { exact: true }).fill('any NI');
      if (journey === 'registration') {
        await page.getByLabel('Teachers’ reference number (TRN)', { exact: true }).fill('any TRN');
        await fillDate(page, 'dob', ['day', 'month', 'year']);
      }
    } else return;
    await submit(page);
  }
}

async function security(page) {
  await page.getByLabel('What is your latest employer’s postcode?', { exact: true }).fill('any postcode');
  await fillDate(page, 'schemeDate', ['day', 'month', 'year']);
  await page.getByLabel('What is the name of your last employer?', { exact: true }).fill('Any employer');
  await submit(page);
}

async function finish(page) {
  for (let count = 0; count < 5; count++) {
    if (page.url().endsWith('/complete')) return;
    if (page.url().endsWith('/new-password')) {
      await page.getByLabel('New password', { exact: true }).fill(password);
      await page.getByLabel('Confirm new password', { exact: true }).fill('different');
    } else if (page.url().endsWith('/setup-2fa')) {
      await page.getByLabel('Text message to your phone ending in 6789').check();
      await page.getByLabel('Verification code', { exact: true }).fill('any code');
    } else if (page.url().endsWith('/recover-email')) {
      await page.getByLabel('New email address', { exact: true }).fill('any new email');
      await page.getByLabel('Confirm new email address', { exact: true }).fill('different email');
    } else if (page.url().endsWith('/recovery-code')) {
      await page.getByLabel('Verification code', { exact: true }).fill('any code');
    } else if (page.url().endsWith('/activate')) {
      await submit(page, 'Activate account');
      continue;
    } else throw new Error(`Unexpected stage: ${page.url()}`);
    await submit(page);
  }
  throw new Error('Journey did not complete');
}

for (const journey of journeyNames) {
  for (const risk of [true, false]) {
    test(`${journey}: ${risk ? 'at risk' : 'normal'} journey completes`, async ({ page }) => {
      const failures = [];
      page.on('pageerror', error => failures.push(error.message));
      page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
      await settings(page, { risk });
      await reachSecurity(page, journey);
      if (risk) {
        await expect(page.getByRole('heading', { name: 'Answer your security questions' })).toBeVisible();
        await security(page);
      }
      await finish(page);
      await expect(page.getByRole('heading', { name: /signed in|account has been moved|password has been reset|email address has been updated|verification has been reset|account is ready/ })).toBeVisible();
      await expect(page.locator('.govuk-summary-list')).toContainText(risk ? 'Passed (simulated)' : 'Not required');
      await expect(page.locator('.govuk-summary-list')).toContainText('Off');
      expect(failures).toEqual([]);
    });
  }
}

test('the fail scenario blocks on exactly the third failure, including across reloads and journeys', async ({ page }) => {
  await settings(page, { securityResult: 'fail' });
  await reachSecurity(page, 'login');
  await security(page);
  await expect(page.getByText('You have 2 attempts remaining.')).toBeVisible();
  await page.reload();
  await security(page);
  await expect(page.getByText('You have 1 attempt remaining.')).toBeVisible();
  await security(page);
  await expect(page.getByRole('heading', { name: 'You need to contact the Call Centre' })).toBeVisible();
  await identify(page, 'registration');
  await expect(page.getByRole('heading', { name: 'You need to contact the Call Centre' })).toBeVisible();
});

test('a successful retry clears the at-risk flag and resets failed attempts', async ({ page }) => {
  await settings(page, { attempts: '2' });
  await reachSecurity(page, 'email');
  await security(page);
  await finish(page);
  await expect(page.locator('.govuk-summary-list')).toContainText('Unsuccessful security attempts0');
  await reachSecurity(page, 'login');
  await expect(page.getByRole('heading', { name: 'You have signed in' })).toBeVisible();
});

test('missing answers do not use an attempt; any completed dates work and errors link to inputs', async ({ page }) => {
  await reachSecurity(page, 'email');
  await submit(page);
  await expect(page.locator('.govuk-error-summary')).toBeFocused();
  await page.getByRole('link', { name: 'Enter your latest employer’s postcode' }).click();
  await expect(page.locator('#postcode')).toBeFocused();
  await page.locator('#postcode').fill('anything');
  await fillDate(page, 'schemeDate', ['day', 'month', '']);
  await page.locator('#employer').fill('anything');
  await submit(page);
  await expect(page.getByRole('link', { name: 'Enter your scheme start date' })).toBeVisible();
  await expect(page.getByText(/attempts remaining/)).toHaveCount(0);
  await page.locator('#schemeDate-year').fill('anything');
  await submit(page);
  await expect(page).toHaveURL(/\/recover-email$/);
});

test('email, password and code require values but accept any text with generic errors', async ({ page }) => {
  await page.goto('./#/start/login');
  await submit(page);
  await expect(page.getByRole('link', { name: 'Enter your email address', exact: true })).toBeVisible();
  await page.locator('#email').fill(email);
  await submit(page);
  await submit(page);
  await expect(page.getByRole('link', { name: 'Enter your password', exact: true })).toBeVisible();
  await page.locator('#password').fill(password);
  await submit(page);
  await submit(page);
  await expect(page.getByRole('link', { name: 'Enter your verification code', exact: true })).toBeVisible();
  await page.locator('#code').fill('anything');
  await submit(page);
  await expect(page).toHaveURL(/\/security$/);
});

for (const journey of journeyNames) {
  test(`${journey}: already-blocked member cannot continue`, async ({ page }) => {
    await settings(page, { risk: false, attempts: '3' });
    await identify(page, journey);
    await expect(page).toHaveURL(/\/blocked$/);
  });
}

for (const journey of ['login', 'password', 'email', 'twofactor']) {
  test(`${journey}: inactive member cannot continue`, async ({ page }) => {
    await settings(page, { active: false });
    await identify(page, journey);
    await expect(page).toHaveURL(/\/inactive$/);
  });
}

test('migrated records are checked after email verification', async ({ page }) => {
  await settings(page, { records: false });
  await identify(page, 'migrated');
  await expect(page).toHaveURL(/\/code$/);
  await page.locator('#code').fill('123456');
  await submit(page);
  await expect(page).toHaveURL(/\/mismatch$/);
});

test('registration record mismatch is controlled by prototype settings', async ({ page }) => {
  await settings(page, { records: false });
  await identify(page, 'registration');
  await expect(page).toHaveURL(/\/mismatch$/);
});

test('a direct completion URL cannot skip checks; back navigation remains usable', async ({ page }) => {
  await identify(page, 'login');
  await page.goto('./#/journey/login/complete');
  await expect(page.getByRole('heading', { name: 'Manage your pension', exact: true })).toBeVisible();
  await identify(page, 'login');
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/identify$/);
  await page.locator('#email').fill(email);
  await submit(page);
  await expect(page).toHaveURL(/\/password$/);
});

test('phone layouts do not overflow and retain all journey links', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('./');
  await expect(page.getByRole('link', { name: 'Start now', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Start now', exact: true }).click();
  for (const name of ['Sign in', 'Move your existing account', 'Reset your password', 'Recover your email address', 'Reset two-step verification', 'Create an account']) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await reachSecurity(page, 'registration');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('start page explains the service and leads to account choices without starting a journey', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Manage your pension', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Before you start', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Other ways to access the service', exact: true })).toBeVisible();
  await expect(page.locator('main .govuk-button')).toHaveCount(1);
  await expect(page.locator('main a[href^="#/start/"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Start now', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Access your pension account', exact: true })).toBeVisible();
  await expect(page.locator('main a[href^="#/start/"]')).toHaveCount(6);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Access your pension account', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Enter your email address', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Access your pension account', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to start', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Start now', exact: true })).toBeVisible();
});

test('new passwords and email confirmations only require non-empty values', async ({ page }) => {
  await settings(page, { risk: false });
  await reachSecurity(page, 'password');
  await submit(page);
  await expect(page.locator('.govuk-error-summary__list li')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Enter your new password', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enter your new password again', exact: true })).toBeVisible();
  await page.locator('#newPassword').fill('x');
  await page.locator('#confirmPassword').fill('y');
  await submit(page);
  await expect(page).toHaveURL(/\/complete$/);
  await settings(page, { risk: false });
  await reachSecurity(page, 'email');
  await submit(page);
  await expect(page.getByRole('link', { name: 'Enter your new email address', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enter your new email address again', exact: true })).toBeVisible();
  await page.locator('#newEmail').fill('anything');
  await page.locator('#confirmEmail').fill('different');
  await submit(page);
  await expect(page).toHaveURL(/\/recovery-code$/);
});

test('only scenario and progress data persist, not answers or passwords', async ({ page }) => {
  await reachSecurity(page, 'login');
  await page.locator('#postcode').fill('SENSITIVE-TEST-VALUE');
  await submit(page);
  const saved = await page.evaluate(() => sessionStorage.getItem('teachers-pensions-prototype-v1'));
  expect(saved).not.toContain('SENSITIVE-TEST-VALUE');
  expect(saved).not.toContain(password);
  expect(saved).not.toContain(email);
});

test('official header, service navigation and footer work under a project path', async ({ page }) => {
  const failedRequests = [];
  page.on('response', response => {
    if (response.status() >= 400) failedRequests.push(response.url());
  });
  await page.goto('./#/start/login');
  await expect(page.getByRole('banner').getByRole('link', { name: 'GOV.UK', exact: true })).toBeVisible();
  await expect(page.getByRole('banner').locator('.govuk-header__logotype')).toBeVisible();
  const service = page.getByRole('region', { name: 'Service information' });
  await service.getByRole('link', { name: 'Teachers’ Pensions – Manage your pension' }).click();
  await expect(page.getByRole('heading', { name: 'Manage your pension', exact: true })).toBeVisible();
  const footer = page.getByRole('contentinfo');
  await expect(footer.locator('.govuk-footer__crown')).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Open Government Licence v3.0' })).toBeVisible();
  await expect(footer.getByRole('link', { name: '© Crown copyright' })).toBeVisible();
  await footer.getByRole('link', { name: 'Accessibility', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Accessibility of this prototype' })).toBeVisible();
  expect(failedRequests).toEqual([]);
});
