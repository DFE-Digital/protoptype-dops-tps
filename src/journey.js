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
