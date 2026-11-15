import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { sites } from './fixtures/reports.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const mock = fileURLToPath(new URL('./fixtures/mock-google.mjs', import.meta.url));

for (const scenario of ['complete', 'empty', 'partial', 'auth', 'lookup', 'missing_property']) {
  test(`CLI and email delivery: ${scenario}`, (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'ga4-report-test-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const config = join(dir, 'sites.json'), md = join(dir, 'report.md'), json = join(dir, 'report.json'), email = join(dir, 'email.json');
    const configured = structuredClone(sites);
    if (['lookup', 'missing_property'].includes(scenario)) delete configured[1].propertyId;
    writeFileSync(config, JSON.stringify({ sites: configured }));
    const env = { ...process.env, GA4_TEST_SCENARIO: scenario, GA4_TEST_EMAIL_CAPTURE: email, RESEND_API_KEY: 'SYNTHETIC_KEY', REPORT_EMAIL_TO: 'test@example.invalid', REPORT_EMAIL_FROM: 'Test <test@example.invalid>' };
    const generate = spawnSync(process.execPath, ['--import', mock, 'tools/ga4-rollup.mjs', '--config', config, '--days', '1', '--compare', 'lastweek', '--out', md, '--json', json], { cwd: root, env, encoding: 'utf8', timeout: 15_000 });
    const incomplete = ['partial', 'auth', 'lookup', 'missing_property'].includes(scenario);
    assert.equal(generate.status, incomplete ? 2 : 0, generate.stderr);
    const report = JSON.parse(readFileSync(json, 'utf8'));
    assert.equal(report.status, incomplete ? 'incomplete' : 'complete');
    if (['lookup', 'missing_property'].includes(scenario)) {
      assert.equal(report.coverage.completeSites, 3);
      assert.equal(report.sites.hub.current.activeUsers, 987);
      assert.equal(report.sites.physics.current, null);
    }
    assert.doesNotMatch(generate.stdout + generate.stderr, /987|1000|321|SYNTHETIC_TOKEN|PRIVATE_/);
    assert.doesNotMatch(readFileSync(md, 'utf8'), /PRIVATE_|SYNTHETIC_TOKEN/);
    // Deliberately deliver even after generation exits 2, as the workflow does.
    const send = spawnSync(process.execPath, ['--import', mock, 'tools/ga4-email.mjs', md], { cwd: root, env, encoding: 'utf8', timeout: 15_000 });
    assert.equal(send.status, 0, send.stderr);
    const sent = JSON.parse(readFileSync(email, 'utf8'));
    assert.match(sent.html, /<html>/);
    if (incomplete) {
      assert.match(sent.subject, /INCOMPLETE/);
      assert.doesNotMatch(sent.subject, /0 outcomes/);
      assert.match(sent.html, /Total outcomes: Unavailable/);
    } else {
      assert.doesNotMatch(sent.subject, /INCOMPLETE/);
      if (scenario === 'empty') assert.match(sent.subject, /0 outcomes/);
    }
  });
}

test('workflow final check fails incomplete generation or failed delivery after attempting emails', () => {
  const workflow = readFileSync(join(root, '.github/workflows/ga-reports.yml'), 'utf8');
  const finalStep = workflow.slice(workflow.indexOf('- name: Check report completeness and delivery'));
  const script = finalStep.split('        run: |\n')[1].split('\n').map((line) => line.replace(/^          /, '')).join('\n');
  const success = { DAILY_REQUESTED: 'true', DAILY_GENERATED: 'success', DAILY_SENT: 'success', WEEKLY_REQUESTED: 'false', WEEKLY_GENERATED: 'skipped', WEEKLY_SENT: 'skipped' };
  for (const [overrides, expected] of [
    [{}, 0],
    [{ DAILY_GENERATED: 'failure' }, 1],
    [{ DAILY_SENT: 'failure' }, 1],
    [{ WEEKLY_REQUESTED: 'true', WEEKLY_GENERATED: 'failure', WEEKLY_SENT: 'success' }, 1],
    [{ WEEKLY_REQUESTED: 'true', WEEKLY_GENERATED: 'success', WEEKLY_SENT: 'success' }, 0],
  ]) {
    const check = spawnSync('bash', ['-e', '-c', script], { env: { ...process.env, ...success, ...overrides }, encoding: 'utf8' });
    assert.equal(check.status, expected, check.stderr);
    assert.doesNotMatch(check.stdout, /987|1000|321|SYNTHETIC_TOKEN/);
  }
});
