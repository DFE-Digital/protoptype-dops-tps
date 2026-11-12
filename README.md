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

**Email addresses and TRNs identify fictional test users.** Use an identifier
from the list below. Email matching ignores case and surrounding whitespace;
TRN matching ignores spaces. Account migration collects both, and they must
identify the same test user. Unknown identifiers display a clear error.

Passwords, codes and all other fields accept **any non-empty value**. TRNs
entered later on the registration identity page are also required-only.
There are no calendar-date checks, password-strength rules or confirmation-field
matching. Empty fields display plain prompts such as "Enter your email address".
Every date field needs its day, month and year filled in, but their values can
be anything. Do not enter real personal information.

After the initial journey-specific steps, an at-risk member must fill in all
3 security questions. The identified member's **Security-question result**
determines the outcome, regardless of the answers:

- **Pass** simulates at least 2 correct answers, clears the at-risk flag and
  resets failed attempts.
- **Fail** simulates 0 or 1 correct answers and increases failed attempts.

A third failure blocks
self-service across all journeys **for that member** and displays the Call Centre message. A member
already blocked is stopped after identification, before any other checks.

### Fictional test users

Open **Prototype users and settings** in the footer, or go directly to
[the test-user list](https://dfe-digital.github.io/protoptype-dops-tps/#/test-users).
Each entry shows the member's current record and offers a recommended journey
with their email and TRN prefilled. Users still choose their journey, as in the
decision flow; recommended journeys do not add eligibility rules to the diagram.

| Member | Email | TRN | Starting scenario / recommended journey |
| --- | --- | --- | --- |
| Alex Taylor | alex.taylor@example.com | 1234567 | Normal sign-in, no extra security check |
| Sam Morgan | sam.morgan@example.com | 1234568 | At-risk sign-in, security check passes |
| Jordan Lee | jordan.lee@example.com | 1234569 | At-risk sign-in, security checks fail; starts at 0 failed attempts |
| Casey Patel | casey.patel@example.com | 1234570 | Already blocked after 3 failed security checks, across all journeys |
| Robin Clarke | robin.clarke@example.com | 1234571 | Inactive; sign-in and account recovery stop |
| Jamie Reed | jamie.reed@example.com | 1234572 | Move a previous-service account with matching records |
| Taylor Brooks | taylor.brooks@example.com | 1234573 | Record mismatch during account migration or registration |
| Morgan Ellis | morgan.ellis@example.com | 1234574 | Reset two-step verification after a passing extra security check |
| Riley Shah | riley.shah@example.com | 1234575 | Reset a forgotten password, no extra security check |
| Avery Jones | avery.jones@example.com | 1234576 | Recover email by TRN, with a passing extra security check |
| Charlie Williams | charlie.williams@example.com | 1234577 | Register with a matching pension record |
| Drew Evans | drew.evans@example.com | 1234578 | At risk, 2 failed attempts; the next security check fails and blocks access |

These are entirely fictional records, not real members. Example passwords,
codes, dates and security answers in expandable help are optional; any non-empty
values work for those fields. Blank answers do not consume a security attempt.

**Change settings for [member]** edits only that user's at-risk flag, security
result, previous failed-attempt count, active status and record-match flag.
Saving settings clears the current journey but preserves other members' records.
Flags and attempt counts remain independent when switching users or journeys and
survive reloads in the same tab. Successful security checks clear only that
member's at-risk flag and reset their attempt count.

Use **Reset test users** on the list to restore every member's starting record
and clear the current journey. Closing the tab also ends the test session.

### Deliberate prototype assumptions

- The previous-member service is presented as "Move your existing account"
  rather than the technical label "Migrated User Login".
- The forgotten-email identification method and approved recovery action were
  unspecified in the flow; this prototype uses the fields and action above.
- Verification codes can be any non-empty text; no email or SMS is sent.
- Identifiers select a fictional member; remaining fields are required-only for
  easy research walkthroughs. Member records, rather than entered answers,
  control record matches and security outcomes.
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
They cover all 6 normal and at-risk journeys with permissive non-identifier
fields, every preset member, identifier matching, simulated pass/fail results,
member-specific retries and blocking, overrides, reset, reloads, record checks,
validation, routing guards and mobile overflow. They do not constitute an
accessibility audit.

## Privacy and limitations

Never enter real personal information or passwords. Only scenario flags,
fictional member IDs and journey progress are kept in browser session storage
for the current tab.
Entered answers, email addresses and passwords are not persisted or sent to an
application server. Closing the tab ends the session. There are no analytics,
external CDN requests or application cookies. GitHub Pages can still process
normal hosting request information.

All record checks, codes and account changes are simulated. The source and test
answers are public; browser-side guards are only prototype behaviour, **not
authentication or security controls**. A production service needs a secure
backend, real verification, approved content and policies, and accessibility
and security reviews.
