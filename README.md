# Teachers' Pensions: Manage your pension

A static, fictional Department for Education service prototype using **GOV.UK
Frontend**. No server, API, database or credentials are needed in production.
This is not a live government or Teachers' Pensions service.

## Live prototype

<https://dfe-digital.github.io/protoptype-dops-tps/>

Changes pushed to `main` are tested, built and deployed by the
[GitHub Pages workflow](https://github.com/DFE-Digital/protoptype-dops-tps/actions/workflows/pages.yml).
The build uses Ubuntu 24.04, which is supported by the pinned Playwright release.

## Run locally

Use Node.js 22 LTS or later.

```sh
npm ci
npm run build
npm start
```

Open <http://127.0.0.1:4173>. Rebuild after changing source files.
The production site consists only of the generated `dist/` folder.

## Try the journeys

The start page follows the GOV.UK
[Start using a service pattern](https://design-system.service.gov.uk/patterns/start-using-a-service/):
it explains what the service does, who it is for, what you may need, and the
alternative support route. Contact details are not invented. Select **Start now**
to reach the account-access page, which offers all 6 journeys from the supplied
decision flow:

1. Sign in: identify member, active-status check, password, two-step verification.
2. Move an existing account: email and TRN check, email verification, simulated
   Ping/pension-record match, last name and National Insurance check, then
   password and two-step verification setup.
3. Reset password: active-status check, email verification, initial two-step
   verification, then password reset.
4. Recover email: active-status check and identification using TRN, last name
   and date of birth, then a simulated approved recovery action: choosing a
   new email and verifying it.
5. Reset two-step verification: active-status check, password, standard email
   verification, then verification-method setup.
6. Registration: matching pension-record email, email verification, identity
   checks, then password, two-step verification and account activation.

All form fields accept **any non-empty value**. There are no checks against
example data, format or calendar-date checks, password-strength rules, or
confirmation-field matching. Empty fields display plain prompts such as
"Enter your email address". Every date field needs its day, month and year
filled in, but their values can be anything.

After the initial journey-specific steps, an at-risk member must fill in all
3 security questions. The **Security-question result** in prototype settings
determines the outcome, regardless of the answers:

- **Pass** simulates at least 2 correct answers, clears the at-risk flag and
  resets failed attempts.
- **Fail** simulates 0 or 1 correct answers and increases failed attempts.

A third failure blocks
self-service across all journeys and displays the Call Centre message. A member
already blocked is stopped after identification, before any other checks.

Use **Prototype settings and test data** in the footer to change the at-risk
flag, security-question result, previous failed-attempt count, active status or
simulated record match.
Saving settings explicitly starts a new test. By default the member is active,
at risk, with no failed attempts, matching records and a passing security result.

### Fictional details

| Detail | Value |
| --- | --- |
| Email | alex.taylor@example.com |
| Password | ExamplePassword1! |
| All verification codes | 123456 |
| TRN | 1234567 |
| Last name | Taylor |
| National Insurance number | QQ123456C |
| Date of birth | 15 June 1985 |
| Latest employer postcode | TE1 2ST |
| Scheme start date | 1 September 2010 |
| Last employer | Example Academy |

These are optional examples, also available in expandable help. You do not need
to use them. To fail a security check, select **Fail** in prototype settings.
Blank answers display validation errors without consuming an attempt.

### Deliberate prototype assumptions

- The previous-member service is presented as "Move your existing account"
  rather than the technical label "Migrated User Login".
- The forgotten-email identification method and approved recovery action were
  unspecified in the flow; this prototype uses the fields and action above.
- Verification codes can be any non-empty text; no email or SMS is sent.
- Fields are required-only for easy research walkthroughs. Entered values do
  not control record matches or security outcomes; prototype settings do.
- Inactive records and record mismatches end with a contact-support message.
  Active-status checks are not added to migration or registration.
- Phone numbers, contact details, real pension amounts and authenticated pension
  features are intentionally not invented.
- The header, footer and service navigation use the official GOV.UK Frontend
  Nunjucks macros, rendered at build time from `src/index.njk`. The service
  navigation shows the service name only; journey links remain in the main
  content. The prototype banner remains visible above the GOV.UK header.
  System fonts are used because GDS Transport is restricted to authorised domains. GOV.UK
  Frontend's MIT licence is included in [GOVUK-LICENSE.txt](./GOVUK-LICENSE.txt).
  GOV.UK branding and the standard footer notices are reproduced for prototype
  fidelity, not as a claim of government ownership or endorsement.

## Publish on GitHub Pages

1. Create a GitHub repository and push these source files to its `main` branch.
   Include `package-lock.json`; do not commit `node_modules/` or `dist/`.
2. In **Settings > Pages > Build and deployment**, set **Source** to
   **GitHub Actions**.
3. Open **Actions > Test and deploy prototype to GitHub Pages** and choose
   **Run workflow**, or push another commit to `main`.
4. The workflow builds, runs the journey tests, and deploys `dist/`. Its deploy
   job links to the published site.

If your default branch is not `main`, update the workflow's branch filter.
GitHub Pages availability for private repositories depends on your GitHub plan.
Do not publish confidential material: this prototype is designed for public,
fictional research content. `noindex` is not access control.

All assets and navigation URLs are relative, and routes use URL fragments, so
the same build works at `https://OWNER.github.io/REPOSITORY/` or a custom domain
without a base-URL change or a server-side fallback. Reloading a journey works.
Do not open the HTML using `file://`; use a static HTTP server.

## Validate

```sh
npm run build
npx playwright install chromium
npm test
```

Tests serve the site beneath `/teachers-pensions/`, not just at the domain root.
They cover all 6 normal and at-risk journeys with arbitrary values, simulated pass/fail results, retries,
cross-journey blocking, reloads, record checks, validation, routing guards and
mobile overflow. They do not constitute an accessibility audit.

## Privacy and limitations

Never enter real personal information or passwords. Only scenario flags and
journey progress are kept in browser session storage for the current tab.
Entered answers, email addresses and passwords are not persisted or sent to an
application server. Closing the tab ends the session. There are no analytics,
external CDN requests or application cookies. GitHub Pages can still process
normal hosting request information.

All record checks, codes and account changes are simulated. The source and test
answers are public; browser-side guards are only prototype behaviour, **not
authentication or security controls**. A production service needs a secure
backend, real verification, approved content and policies, and accessibility
and security reviews.
