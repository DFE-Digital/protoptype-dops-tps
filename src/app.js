import { initAll } from './assets/govuk-frontend.min.js';
import { MEMBER, JOURNEYS, evaluateSecurity, advance } from './journey.js';

const main = document.querySelector('#main-content');
const navigation = document.querySelector('#navigation');
const storageKey = 'teachers-pensions-prototype-v1';
const defaults = () => ({
  atRisk: true, failedAttempts: 0, active: true, recordsMatch: true, securityResult: 'pass',
  journey: null, stage: null, visited: [], verified: false, method: 'email'
});
let storageAvailable = true;
let state = defaults();
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
  if (saved && typeof saved.atRisk === 'boolean' && Number.isInteger(saved.failedAttempts) &&
      saved.failedAttempts >= 0 && saved.failedAttempts <= 3 && Array.isArray(saved.visited) &&
      typeof saved.active === 'boolean' && typeof saved.recordsMatch === 'boolean' &&
      (saved.securityResult === undefined || ['pass', 'fail'].includes(saved.securityResult))) {
    state = { ...defaults(), ...saved };
  }
} catch (error) {
  storageAvailable = false;
  console.warn('Prototype session could not be restored. Progress will only last until this page is reloaded.', error);
}
let errors = {};
let values = {};
let settingsSaved = false;

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const link = (href, text, classes = '') => `<a class="govuk-link ${classes}" href="${href}">${text}</a>`;
const p = text => `<p class="govuk-body">${text}</p>`;
const button = (text = 'Continue') => `<button class="govuk-button" data-module="govuk-button" type="submit">${text}</button>`;
const form = content => `<form novalidate>${content}${button()}</form>`;
const heading = (title, caption) => `${caption ? `<span class="govuk-caption-l step-caption">${caption}</span>` : ''}<h1 class="govuk-heading-xl">${title}</h1>`;
const errorText = name => errors[name] ? `<p id="${name}-error" class="govuk-error-message"><span class="govuk-visually-hidden">Error:</span> ${escape(errors[name])}</p>` : '';
const describedBy = (name, hint) => [hint ? `${name}-hint` : '', errors[name] ? `${name}-error` : ''].filter(Boolean).join(' ');

function field(name, label, options = {}) {
  const { hint, type = 'text', width = '20', autocomplete = 'off', inputmode } = options;
  return `<div class="govuk-form-group ${errors[name] ? 'govuk-form-group--error' : ''}">
    <label class="govuk-label govuk-label--s" for="${name}">${label}</label>
    ${hint ? `<div class="govuk-hint" id="${name}-hint">${hint}</div>` : ''}
    ${errorText(name)}
    <input class="govuk-input govuk-input--width-${width} ${errors[name] ? 'govuk-input--error' : ''}"
      id="${name}" name="${name}" type="${type}" autocomplete="${autocomplete}"
      ${inputmode ? `inputmode="${inputmode}"` : ''}
      ${describedBy(name, hint) ? `aria-describedby="${describedBy(name, hint)}"` : ''}
      ${errors[name] ? 'aria-invalid="true"' : ''}
      ${type !== 'password' ? `value="${escape(values[name] || '')}"` : ''}>
  </div>`;
}

function dateField(name, label, hint) {
  return `<div class="govuk-form-group ${errors[name] ? 'govuk-form-group--error' : ''}">
    <fieldset class="govuk-fieldset" ${describedBy(name, hint) ? `aria-describedby="${describedBy(name, hint)}"` : ''}>
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">${label}</legend>
      <div class="govuk-hint" id="${name}-hint">${hint}</div>${errorText(name)}
      <div class="govuk-date-input" id="${name}">
      ${['day', 'month', 'year'].map((part, index) => `<div class="govuk-date-input__item">
        <div class="govuk-form-group"><label class="govuk-label govuk-date-input__label" for="${name}-${part}">${['Day', 'Month', 'Year'][index]}</label>
        <input class="govuk-input govuk-date-input__input govuk-input--width-${index === 2 ? '4' : '2'} ${errors[name] ? 'govuk-input--error' : ''}"
          id="${name}-${part}" name="${name}-${part}" type="text" inputmode="numeric" autocomplete="off"
          ${errors[name] ? `aria-invalid="true" aria-describedby="${name}-error"` : ''}
          value="${escape(values[`${name}-${part}`] || '')}"></div></div>`).join('')}
      </div>
    </fieldset></div>`;
}

function radios(name, label, choices, selected, hint = '') {
  return `<div class="govuk-form-group"><fieldset class="govuk-fieldset" ${hint ? `aria-describedby="${name}-hint"` : ''}>
    <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">${label}</legend>
    ${hint ? `<div class="govuk-hint" id="${name}-hint">${hint}</div>` : ''}
    <div class="govuk-radios" data-module="govuk-radios">
    ${choices.map(([value, text], index) => `<div class="govuk-radios__item">
      <input class="govuk-radios__input" id="${name}-${index}" name="${name}" type="radio" value="${value}" ${String(selected) === value ? 'checked' : ''}>
      <label class="govuk-label govuk-radios__label" for="${name}-${index}">${text}</label>
    </div>`).join('')}</div></fieldset></div>`;
}

function summary(rows) {
  return `<dl class="govuk-summary-list">${rows.map(([key, value]) => `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">${key}</dt><dd class="govuk-summary-list__value">${value}</dd></div>`).join('')}</dl>`;
}

function demoDetails(security = false) {
  const rows = security ? [
    ['Latest employer postcode', MEMBER.postcode],
    ['Scheme start date', '1 September 2010'],
    ['Last employer name', MEMBER.employer]
  ] : [
    ['Email address', MEMBER.email],
    ['Password', `<span class="demo-code">${MEMBER.password}</span>`],
    ['Verification code', `<span class="demo-code">${MEMBER.code}</span>`],
    ['Teachers’ reference number (TRN)', MEMBER.trn],
    ['Last name', MEMBER.lastName],
    ['National Insurance number', MEMBER.ni],
    ['Date of birth', '15 June 1985']
  ];
  return `<details class="govuk-details demo-details" data-module="govuk-details">
    <summary class="govuk-details__summary"><span class="govuk-details__summary-text">Example details for this prototype</span></summary>
    <div class="govuk-details__text">${p('You can use these examples or enter any other fictional values. Nothing is sent to Teachers’ Pensions.')}${summary(rows)}
    ${security ? p(`Answers are not checked. Choose whether the check passes or fails in ${link('#/scenarios', 'prototype settings')}.`) : ''}</div>
  </details>`;
}

function persist() {
  if (!storageAvailable) return;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    storageAvailable = false;
    console.warn('Prototype progress could not be saved.', error);
  }
}

function go(stage) {
  state.stage = stage;
  if (!state.visited.includes(stage)) state.visited.push(stage);
  persist();
  location.hash = `/journey/${state.journey}/${stage}`;
}

function next() {
  go(advance(state.journey, state.stage, state));
}

function home() {
  return heading('Manage your pension') +
    p('Use this service to access your Teachers’ Pensions account. You can:') +
    `<ul class="govuk-list govuk-list--bullet">
      <li>sign in to your account</li>
      <li>create an account or move an account from the previous member service</li>
      <li>get help with your email address, password or two-step verification</li>
    </ul>` +
    p('This service is for members of the Teachers’ Pension Scheme.') +
    `<h2 class="govuk-heading-m">Before you start</h2>` +
    p('You may need:') +
    `<ul class="govuk-list govuk-list--bullet">
      <li>your Teachers’ reference number (TRN)</li>
      <li>your National Insurance number</li>
      <li>access to the email address or phone linked to your account</li>
    </ul>` +
    p('We’ll ask you to confirm who you are. You may also need to answer questions about your employer and when you joined the pension scheme.') +
    `<a class="govuk-button govuk-button--start" data-module="govuk-button" href="#/account">Start now
      <svg class="govuk-button__start-icon" xmlns="http://www.w3.org/2000/svg" width="17.5" height="19" viewBox="0 0 33 40" aria-hidden="true" focusable="false"><path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z"/></svg></a>
    <h2 class="govuk-heading-m">Other ways to access the service</h2>` +
    p('If you cannot use the online service, contact the Teachers’ Pensions Call Centre for help accessing your account.') +
    p('Contact details and offline support are not included in this prototype.');
}

function accountPage() {
  const journeyLinks = ids => `<ul class="govuk-list govuk-list--spaced">${ids.map(id => `<li>${link(`#/start/${id}`, JOURNEYS[id].title)}</li>`).join('')}</ul>`;
  return heading('Access your pension account', 'Teachers’ Pensions') +
    p('Sign in if you already have an account with this service.') +
    `<a class="govuk-button" data-module="govuk-button" href="#/start/login">Sign in</a>` +
    `<h2 class="govuk-heading-m">If you cannot sign in</h2>` +
    journeyLinks(['password', 'email', 'twofactor']) +
    `<h2 class="govuk-heading-m">If you have not used this service before</h2>` +
    p('Create an account, or move your account if you used the previous member service.') +
    journeyLinks(['registration', 'migrated']);
}

function identify() {
  const journey = state.journey;
  const emailRecovery = journey === 'email';
  return heading(emailRecovery ? 'Enter your pension details' : 'Enter your email address', JOURNEYS[journey].title) +
    p(emailRecovery ? 'Enter your details so we can identify your pension account.' : 'Enter the email address linked to your Teachers’ Pensions account.') +
    form(emailRecovery ?
      field('trn', 'Teachers’ reference number (TRN)', { width: '10', inputmode: 'numeric' }) +
      field('lastName', 'Last name') +
      dateField('dob', 'Date of birth', 'For example, 15 6 1985') :
      field('email', 'Email address', { type: 'email', width: '30', autocomplete: 'off' }) +
      (journey === 'migrated' ? field('trn', 'Teachers’ reference number (TRN)', { width: '10', inputmode: 'numeric' }) : '')) +
    demoDetails();
}

function passwordPage() {
  return heading('Enter your password', JOURNEYS[state.journey].title) +
    form(field('password', 'Password', { type: 'password', autocomplete: 'off' })) +
    p(link('#/start/password', 'I have forgotten my password')) + demoDetails();
}

function codePage() {
  const secondFactor = state.stage === 'second-factor';
  const recovery = state.stage === 'recovery-code';
  const sms = secondFactor || state.journey === 'login';
  return heading('Enter your verification code', JOURNEYS[state.journey].title) +
    p(recovery ? 'In a live service, we would send a code to your new email address. No email has been sent in this prototype.' :
      sms ? 'In a live service, we would send a text message to your registered phone ending in 6789. No text message has been sent in this prototype.' :
        'In a live service, we would send a code to your email address. No email has been sent in this prototype.') +
    p('Enter any fictional code to continue.') +
    form(field('code', 'Verification code', { width: '10', inputmode: 'numeric', autocomplete: 'one-time-code' }));
}

function identityPage() {
  const registering = state.journey === 'registration';
  return heading('Enter your pension details', JOURNEYS[state.journey].title) +
    p('Enter your details to continue.') +
    form(field('lastName', 'Last name') +
      field('ni', 'National Insurance number', { hint: 'For example, QQ 12 34 56 C.', width: '20' }) +
      (registering ? field('trn', 'Teachers’ reference number (TRN)', { width: '10', inputmode: 'numeric' }) + dateField('dob', 'Date of birth', 'For example, 15 6 1985') : '')) + demoDetails();
}

function securityPage() {
  return heading('Answer your security questions', 'An extra security check') +
    p('We need to make an extra check to protect your pension account. Answer all 3 questions about the information held on your member record.') +
    `<div class="govuk-inset-text">You can enter any fictional answers. The result is controlled by prototype settings. You can try up to 3 times before you need to contact the Call Centre.</div>` +
    (state.failedAttempts ? `<div class="status-card">${p(`<strong>Your previous answers could not be verified.</strong>`)}${p(`You have ${3 - state.failedAttempts} ${state.failedAttempts === 2 ? 'attempt' : 'attempts'} remaining. Answer all 3 questions again.`)}</div>` : '') +
    form(`<div class="question-group">${field('postcode', 'What is your latest employer’s postcode?', { hint: 'Use the postcode for the latest employer on your pension record.', width: '10' })}</div>
      <div class="question-group">${dateField('schemeDate', 'When did you join the pension scheme?', 'Enter the scheme start date on your pension record. For example, 1 9 2010.')}</div>
      <div class="question-group">${field('employer', 'What is the name of your last employer?', { hint: 'Use the most recent employer name on your pension record.', width: '30' })}</div>`) + demoDetails(true);
}

function newPasswordPage() {
  return heading(state.journey === 'password' ? 'Reset your password' : 'Create your password', JOURNEYS[state.journey].title) +
    p('Enter a new password. Do not use a real password in this prototype.') +
    form(field('newPassword', 'New password', { type: 'password', autocomplete: 'off' }) +
      field('confirmPassword', 'Confirm new password', { type: 'password', autocomplete: 'off' }));
}

function setup2faPage() {
  return heading('Set up two-step verification', JOURNEYS[state.journey].title) +
    p('Choose how you would like to receive a security code when you sign in.') +
    form(radios('method', 'How would you like to receive your code?', [
      ['email', `Email to ${MEMBER.email}`], ['sms', 'Text message to your phone ending in 6789']
    ], state.method) +
      `<div class="govuk-inset-text">No code will be sent. Enter any fictional code to continue.</div>` +
      field('code', 'Verification code', { width: '10', inputmode: 'numeric' }));
}

function recoverEmailPage() {
  return heading('Choose a new sign-in email address', JOURNEYS[state.journey].title) +
    p('Your identity has been confirmed. Enter a fictional new email address to simulate recovering access to your account.') +
    form(field('newEmail', 'New email address', { type: 'email', width: '30', hint: 'For example, alex.new@example.com. Do not enter a real email address.' }) +
      field('confirmEmail', 'Confirm new email address', { type: 'email', width: '30' }));
}

function blockedPage() {
  return heading('You need to contact the Call Centre') +
    `<div class="govuk-warning-text"><span class="govuk-warning-text__icon" aria-hidden="true">!</span><strong class="govuk-warning-text__text"><span class="govuk-visually-hidden">Warning</span>Self-service access to this account is blocked.</strong></div>` +
    p('There have been 3 unsuccessful attempts to answer the security questions. To keep your pension account safe, you cannot continue online.') +
    `<h2 class="govuk-heading-m">What you need to do</h2>` +
    p('Contact the Teachers’ Pensions Call Centre for help verifying your identity and accessing your account.') +
    `<div class="govuk-inset-text">This is the end of this prototype journey. No real account has been blocked. Contact details are intentionally not included.</div>` +
    p(link('#/', 'Return to the service start page')) +
    p(link('#/scenarios', 'Change the prototype scenario'));
}

function completePage() {
  const titles = {
    login: 'You have signed in', migrated: 'Your account has been moved',
    password: 'Your password has been reset', email: 'Your email address has been updated',
    twofactor: 'Two-step verification has been reset', registration: 'Your account is ready'
  };
  return `<div class="govuk-panel govuk-panel--confirmation"><h1 class="govuk-panel__title">${titles[state.journey]}</h1><div class="govuk-panel__body">Prototype journey complete</div></div>` +
    p('This is a demonstration only. No account, password, email address or verification method has actually been changed.') +
    `<h2 class="govuk-heading-m">What happens next</h2>` +
    p(state.journey === 'login' ? 'In a live service, you would now be able to view your pension account.' : 'In a live service, you would now continue to your pension account using your updated sign-in details.') +
    `<div class="status-card"><h2 class="govuk-heading-m">Your verification</h2>` +
    summary([
      ['Journey', JOURNEYS[state.journey].title],
      ['Extra security check', state.verified ? 'Passed (simulated)' : 'Not required'],
      ['At-risk flag', state.atRisk ? 'On' : 'Off'],
      ['Unsuccessful security attempts', String(state.failedAttempts)]
    ]) + '</div>' +
    `<div class="inline-actions"><a class="govuk-button" data-module="govuk-button" href="#/">Return to start</a>${link('#/scenarios', 'Try another scenario')}</div>`;
}

function scenariosPage() {
  return heading('Prototype settings', 'Research and testing') +
    (settingsSaved ? `<div class="govuk-notification-banner govuk-notification-banner--success" role="status"><div class="govuk-notification-banner__header"><h2 class="govuk-notification-banner__title">Success</h2></div><div class="govuk-notification-banner__content">${p('<strong>Scenario saved. Choose a journey to begin.</strong>')}</div></div>` : '') +
    p('Choose the fictional member’s starting state. Settings apply to all 6 journeys in this browser tab. Saving settings starts a new test and clears journey progress.') +
    `<form novalidate>` +
    radios('risk', 'Is the member flagged as at risk?', [['on', 'Yes — ask all 3 security questions'], ['off', 'No — continue without extra security questions']], state.atRisk ? 'on' : 'off') +
    radios('securityResult', 'Security-question result', [['pass', 'Pass — simulate at least 2 correct answers'], ['fail', 'Fail — simulate 0 or 1 correct answers']], state.securityResult, 'Any completed answers are accepted. This setting determines the result, not the values entered.') +
    radios('attempts', 'Previous unsuccessful security attempts', [['0', 'None'], ['1', '1 unsuccessful attempt'], ['2', '2 unsuccessful attempts — one try remaining'], ['3', '3 unsuccessful attempts — self-service blocked']], String(state.failedAttempts)) +
    radios('active', 'Member status', [['yes', 'Active'], ['no', 'Inactive']], state.active ? 'yes' : 'no', 'The active-status check applies to sign-in and account-recovery journeys.') +
    radios('records', 'Do the member records match?', [['yes', 'Yes'], ['no', 'No — simulate a record mismatch']], state.recordsMatch ? 'yes' : 'no', 'Simulates a Ping / pension-record mismatch for moved accounts, or a pension-record mismatch during registration.') +
    button('Save scenario') + '</form>' +
    p(link('#/account', 'Choose a journey')) +
    demoDetails() + demoDetails(true);
}

function errorSummary() {
  const entries = Object.entries(errors);
  if (!entries.length) return '';
  return `<div class="govuk-error-summary" role="alert" tabindex="-1" aria-labelledby="error-title"><h2 class="govuk-error-summary__title" id="error-title">There is a problem</h2><div class="govuk-error-summary__body"><ul class="govuk-list govuk-error-summary__list">
    ${entries.map(([key, message]) => `<li><a href="#${key === 'dob' || key === 'schemeDate' ? `${key}-day` : key}">${escape(message)}</a></li>`).join('')}
    </ul></div></div>`;
}

function render() {
  const parts = location.hash.slice(1).split('/').filter(Boolean);
  const route = parts[0] || 'home';
  let content;
  navigation.innerHTML = '';
  if (route === 'start' && JOURNEYS[parts[1]]) {
    state = { ...state, journey: parts[1], stage: 'identify', visited: ['identify'], verified: false, method: 'email' };
    persist();
    location.replace(`#/journey/${state.journey}/identify`);
    return;
  }
  if (route === 'journey') {
    if (!JOURNEYS[parts[1]] || state.journey !== parts[1] || !state.visited.includes(parts[2])) {
      location.replace('#/');
      return;
    }
    if (state.failedAttempts >= 3 && !['blocked', 'identify'].includes(parts[2])) {
      go('blocked');
      return;
    }
    state.stage = parts[2];
    persist();
    const renderers = {
      identify, password: passwordPage, code: codePage, 'second-factor': codePage,
      'recovery-code': codePage, identity: identityPage, security: securityPage,
      'new-password': newPasswordPage, 'setup-2fa': setup2faPage,
      'recover-email': recoverEmailPage, blocked: blockedPage, complete: completePage,
      activate: () => heading('Activate your account', 'Create an account') +
        p('Your details have been checked and your sign-in methods are ready. Activate your fictional account to complete registration.') +
        `<form novalidate>${button('Activate account')}</form>`,
      inactive: () => heading('Your pension record needs to be checked') +
        p('This online journey is only available to members with an active record. Contact the Teachers’ Pensions Call Centre to check your member status.') +
        p('No real member record has been checked in this prototype.') + p(link('#/', 'Return to start')),
      mismatch: () => heading('We could not match your records') +
        p('The details on your member account do not match your pension record. Contact the Teachers’ Pensions Call Centre so your records can be checked before you continue.') +
        p('This is a simulated record mismatch. No real records have been checked.') + p(link('#/', 'Return to start'))
    };
    content = renderers[state.stage] ? renderers[state.stage]() : home();
    if (!['blocked', 'complete', 'inactive', 'mismatch'].includes(state.stage)) {
      const index = state.visited.indexOf(state.stage);
      const previous = index > 0 ? `#/journey/${state.journey}/${state.visited[index - 1]}` : '#/account';
      navigation.innerHTML = `<a class="govuk-back-link" href="${previous}">Back</a>`;
    }
  } else if (route === 'home') {
    content = home();
  } else {
    navigation.innerHTML = '<a class="govuk-back-link" href="#/">Back to start</a>';
    if (route === 'account') content = accountPage();
    else if (route === 'scenarios') content = scenariosPage();
    else if (route === 'about') content = heading('About this prototype') +
      p('This is a fictional Teachers’ Pensions service concept for the Department for Education. It is not GOV.UK or a live Teachers’ Pensions service.') +
      p('The 6 journeys demonstrate sign-in, moving an existing account, forgotten passwords, forgotten email addresses, resetting two-step verification and registration.') +
      p('Member identification, record checks, codes and account changes are simulated in your browser. All fields accept any non-empty value. Dates, formats, password strength and confirmation matches are not checked. The at-risk flag is checked after the journey-specific steps. All 3 security questions are asked, but prototype settings determine whether the check passes or fails. A third failed attempt blocks self-service across journeys.') +
      p('Only fictional scenario settings and journey progress are stored in session storage in this tab. Form answers and passwords are not stored. Closing the tab clears the session. There are no analytics or application cookies.') +
      p('If hosted on GitHub Pages, the hosting provider may receive normal web request information. Do not enter personal information into this prototype.') +
      p('The prototype uses GOV.UK Frontend under its MIT licence, with system fonts rather than the restricted GDS Transport font. It has not been endorsed by GOV.UK or the Department for Education.');
    else if (route === 'accessibility') content = heading('Accessibility of this prototype') +
      p('This prototype uses GOV.UK Design System form components, visible labels, keyboard navigation, error summaries and responsive layouts.') +
      p('When you move to a new page, focus moves to the main content. If there is a form error, focus moves to the error summary. Each error links to the relevant field.') +
      p('JavaScript is required to try the journeys. This is a research prototype, not an audited production service, and we do not claim full WCAG compliance.') +
      p('Before using this design in a live service, test it with assistive technology and users with access needs, and complete an accessibility audit.');
    else content = heading('Page not found') + p(link('#/', 'Return to the service start page'));
  }
  main.innerHTML = (!storageAvailable ? `<div class="govuk-inset-text">Browser storage is unavailable. Progress will be lost if you reload this page.</div>` : '') +
    `<div class="govuk-grid-row"><div class="govuk-grid-column-two-thirds">${errorSummary()}${content}</div></div>`;
  initAll({ scope: main });
  const title = main.querySelector('h1');
  document.title = `${Object.keys(errors).length ? 'Error: ' : ''}${title ? title.textContent : 'Manage your pension'} — Teachers’ Pensions prototype`;
  const focusTarget = main.querySelector('.govuk-error-summary') || main;
  focusTarget.focus();
  if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  const currentForm = main.querySelector('form');
  if (currentForm) currentForm.addEventListener('submit', onSubmit);
}

function onSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  errors = {};
  values = {};
  for (const [key, value] of data) {
    if (!key.toLowerCase().includes('password')) values[key] = value;
  }
  const get = name => String(data.get(name) || '').trim();
  const required = (name, message) => { if (!get(name)) errors[name] = message; };
  const requiredDate = (name, message) => {
    if (['day', 'month', 'year'].some(part => !get(`${name}-${part}`))) errors[name] = message;
  };
  if (location.hash === '#/scenarios') {
    state = { ...defaults(), atRisk: get('risk') === 'on', failedAttempts: Number(get('attempts')), active: get('active') === 'yes', recordsMatch: get('records') === 'yes', securityResult: get('securityResult') };
    persist();
    settingsSaved = true;
    render();
    return;
  }
  const stage = state.stage;
  if (stage === 'identify') {
    if (state.journey === 'email') {
      required('trn', 'Enter your Teachers’ reference number');
      required('lastName', 'Enter your last name');
      requiredDate('dob', 'Enter your date of birth');
    } else {
      required('email', 'Enter your email address');
      if (state.journey === 'migrated') required('trn', 'Enter your Teachers’ reference number');
    }
  } else if (stage === 'password') {
    required('password', 'Enter your password');
  } else if (['code', 'second-factor', 'recovery-code', 'setup-2fa'].includes(stage)) {
    required('code', 'Enter your verification code');
  } else if (stage === 'identity') {
    required('lastName', 'Enter your last name');
    required('ni', 'Enter your National Insurance number');
    if (state.journey === 'registration') {
      required('trn', 'Enter your Teachers’ reference number');
      requiredDate('dob', 'Enter your date of birth');
    }
  } else if (stage === 'security') {
    required('postcode', 'Enter your latest employer’s postcode');
    requiredDate('schemeDate', 'Enter your scheme start date');
    required('employer', 'Enter the name of your last employer');
  } else if (stage === 'new-password') {
    required('newPassword', 'Enter your new password');
    required('confirmPassword', 'Enter your new password again');
  } else if (stage === 'recover-email') {
    required('newEmail', 'Enter your new email address');
    required('confirmEmail', 'Enter your new email address again');
  }
  if (Object.keys(errors).length) {
    render();
    return;
  }
  values = {};
  // Rewinding a journey invalidates later pages, so a saved URL cannot skip a check.
  state.visited = state.visited.slice(0, state.visited.indexOf(stage) + 1);
  if (stage === 'identify') {
    if (state.failedAttempts >= 3) return go('blocked');
    if (!state.active && !['registration', 'migrated'].includes(state.journey)) return go('inactive');
    if (!state.recordsMatch && state.journey === 'registration') return go('mismatch');
  }
  if (stage === 'code' && state.journey === 'migrated' && !state.recordsMatch) return go('mismatch');
  if (stage === 'security') {
    const result = evaluateSecurity(state);
    state.failedAttempts = result.failedAttempts;
    state.atRisk = result.atRisk;
    if (result.outcome === 'blocked') return go('blocked');
    if (result.outcome === 'retry') {
      persist();
      render();
      return;
    }
    state.verified = true;
  }
  if (stage === 'setup-2fa') state.method = get('method');
  next();
}

window.addEventListener('hashchange', () => {
  // Error-summary anchors refer to fields, not application routes.
  if (location.hash && !location.hash.startsWith('#/')) return;
  errors = {};
  values = {};
  settingsSaved = false;
  render();
});
document.addEventListener('click', event => {
  const anchor = event.target.closest('.govuk-error-summary a');
  if (anchor) {
    event.preventDefault();
    const target = document.getElementById(anchor.getAttribute('href').slice(1));
    if (target) { target.focus(); target.scrollIntoView({ block: 'center' }); }
  }
});
initAll();
render();
