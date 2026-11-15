// Subprocess preload: all requests are intercepted; no Google/Resend calls leave the test.
import { generateKeyPairSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { response } from './reports.mjs';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.GOOGLE_APPLICATION_CREDENTIALS = '';
process.env.GA_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: 'test@example.invalid', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() });
globalThis.fetch = async (url, init) => {
  if (url === 'https://oauth2.googleapis.com/token') return process.env.GA4_TEST_SCENARIO === 'auth'
    ? Response.json({ error: 'PRIVATE_AUTH_CANARY' }, { status: 403 }) : Response.json({ access_token: 'SYNTHETIC_TOKEN' });
  if (url === 'https://api.resend.com/emails') {
    if (!process.env.GA4_TEST_EMAIL_CAPTURE) throw new Error('Missing test email capture');
    writeFileSync(process.env.GA4_TEST_EMAIL_CAPTURE, init.body);
    return Response.json({ id: 'synthetic-email' });
  }
  if (url.startsWith('https://analyticsadmin.googleapis.com/')) {
    return process.env.GA4_TEST_SCENARIO === 'lookup'
      ? Response.json({ error: 'PRIVATE_LOOKUP_CANARY' }, { status: 403 })
      : Response.json({ accountSummaries: [] });
  }
  if (/^https:\/\/analyticsdata\.googleapis\.com\/v1beta\/properties\/\d+:runReport$/.test(url)) {
    if (process.env.GA4_TEST_SCENARIO === 'partial' && !url.includes('/1:')) return Response.json({ error: { message: 'PRIVATE_ERROR_CANARY' } }, { status: 403 });
    return Response.json(response(JSON.parse(init.body), { empty: process.env.GA4_TEST_SCENARIO === 'empty' }));
  }
  throw new Error('Unexpected request blocked by test');
};
