export const MEMBER = Object.freeze({
  email: 'alex.taylor@example.com',
  trn: '1234567',
  firstName: 'Alex',
  lastName: 'Taylor',
  ni: 'QQ123456C',
  dob: ['15', '6', '1985'],
  postcode: 'TE1 2ST',
  employer: 'Example Academy',
  schemeDate: ['1', '9', '2010'],
  password: 'ExamplePassword1!',
  code: '123456'
});

const normalRecord = { active: true, atRisk: false, failedAttempts: 0, recordsMatch: true, securityResult: 'pass' };

export const MEMBERS = Object.freeze([
  { ...normalRecord, id: 'alex', name: 'Alex Taylor', email: 'alex.taylor@example.com', trn: '1234567', journey: 'login', description: 'Active member. Signs in without extra security questions.' },
  { ...normalRecord, id: 'sam', name: 'Sam Morgan', email: 'sam.morgan@example.com', trn: '1234568', journey: 'login', atRisk: true, description: 'At-risk member. The extra security check passes.' },
  { ...normalRecord, id: 'jordan', name: 'Jordan Lee', email: 'jordan.lee@example.com', trn: '1234569', journey: 'login', atRisk: true, securityResult: 'fail', description: 'At-risk member. Security checks fail, allowing retries until the third failure blocks access.' },
  { ...normalRecord, id: 'casey', name: 'Casey Patel', email: 'casey.patel@example.com', trn: '1234570', journey: 'login', atRisk: true, failedAttempts: 3, description: 'Already blocked after 3 failed security checks. Stops immediately after identification in every journey.' },
  { ...normalRecord, id: 'robin', name: 'Robin Clarke', email: 'robin.clarke@example.com', trn: '1234571', journey: 'login', active: false, description: 'Inactive member. Cannot continue with sign-in or account recovery.' },
  { ...normalRecord, id: 'jamie', name: 'Jamie Reed', email: 'jamie.reed@example.com', trn: '1234572', journey: 'migrated', description: 'Previous-service member with matching records. Moves their account and sets up a password and two-step verification.' },
  { ...normalRecord, id: 'taylor', name: 'Taylor Brooks', email: 'taylor.brooks@example.com', trn: '1234573', journey: 'migrated', recordsMatch: false, description: 'Member and pension records do not match. Account migration stops after email verification; registration stops after identification.' },
  { ...normalRecord, id: 'morgan', name: 'Morgan Ellis', email: 'morgan.ellis@example.com', trn: '1234574', journey: 'twofactor', atRisk: true, description: 'Needs to reset two-step verification. Passes an extra security check before setting up a new method.' },
  { ...normalRecord, id: 'riley', name: 'Riley Shah', email: 'riley.shah@example.com', trn: '1234575', journey: 'password', description: 'Needs to reset a forgotten password. No extra security questions are required.' },
  { ...normalRecord, id: 'avery', name: 'Avery Jones', email: 'avery.jones@example.com', trn: '1234576', journey: 'email', atRisk: true, description: 'Has forgotten their email address. Identified by TRN, then passes an extra security check before email recovery.' },
  { ...normalRecord, id: 'charlie', name: 'Charlie Williams', email: 'charlie.williams@example.com', trn: '1234577', journey: 'registration', description: 'Registers a new account using a matching pension record, then sets up a password and two-step verification.' },
  { ...normalRecord, id: 'drew', name: 'Drew Evans', email: 'drew.evans@example.com', trn: '1234578', journey: 'login', atRisk: true, failedAttempts: 2, securityResult: 'fail', description: 'Has 2 previous failed security checks. One more unsuccessful check blocks self-service.' }
].map(member => Object.freeze(member)));

export function scenarioFor(member) {
  const { active, atRisk, failedAttempts, recordsMatch, securityResult } = member;
  return { active, atRisk, failedAttempts, recordsMatch, securityResult };
}

export const JOURNEYS = Object.freeze({
  login: { title: 'Sign in', description: 'Access your Teachers’ Pensions account.', stages: ['identify', 'password', 'code', 'risk', 'complete'] },
  migrated: { title: 'Move your existing account', description: 'Set up new sign-in details if you used the previous member service.', stages: ['identify', 'code', 'identity', 'risk', 'new-password', 'setup-2fa', 'complete'] },
  password: { title: 'Reset your password', description: 'Get back into your account if you have forgotten your password.', stages: ['identify', 'code', 'second-factor', 'risk', 'new-password', 'complete'] },
  email: { title: 'Recover your email address', description: 'Recover access if you have forgotten your sign-in email address.', stages: ['identify', 'risk', 'recover-email', 'recovery-code', 'complete'] },
  twofactor: { title: 'Reset two-step verification', description: 'Set up verification again if you cannot use your current method.', stages: ['identify', 'password', 'code', 'risk', 'setup-2fa', 'complete'] },
  registration: { title: 'Create an account', description: 'Register to manage your teachers’ pension online for the first time.', stages: ['identify', 'code', 'identity', 'risk', 'new-password', 'setup-2fa', 'activate', 'complete'] }
});

export function evaluateSecurity(member) {
  if (member.failedAttempts >= 3) return { ...member, outcome: 'blocked' };
  if (member.securityResult === 'pass') {
    return { ...member, atRisk: false, failedAttempts: 0, outcome: 'verified' };
  }
  const failedAttempts = member.failedAttempts + 1;
  return { ...member, failedAttempts, outcome: failedAttempts >= 3 ? 'blocked' : 'retry' };
}

export function advance(journey, stage, member) {
  if (member.failedAttempts >= 3) return 'blocked';
  const stages = JOURNEYS[journey].stages;
  const next = stages[stages.indexOf(stage) + 1];
  if (next === 'risk') return member.atRisk ? 'security' : stages[stages.indexOf('risk') + 1];
  if (stage === 'security') return stages[stages.indexOf('risk') + 1];
  return next || 'complete';
}
