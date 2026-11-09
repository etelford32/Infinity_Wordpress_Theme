#!/usr/bin/env node
/**
 * Apply the GA4 settings in tools/ga4-sites.json to all four properties:
 * each site's "outcomes" become key events, its "dimensions" become
 * event-scoped custom dimensions. Anything already there is left alone,
 * so it is safe to re-run; nothing is ever deleted.
 *
 * The service account needs the Editor role on each property for this
 * one (the reports only need Viewer). Node 18+, no npm install.
 *
 *   node tools/ga4-config.mjs --key ~/.config/ga/ga-reporting.json --dry-run
 *   node tools/ga4-config.mjs --key ~/.config/ga/ga-reporting.json
 *   node tools/ga4-config.mjs --key ... --site landscaping   # one site only
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMIN_API, SCOPE_EDIT, api, die, getToken, listAll, loadAccount, parseArgs } from './ga4/google.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2), {
  defaults: { config: join(HERE, 'ga4-sites.json') },
  options: {
    '--key': { name: 'key' },
    '--config': { name: 'config' },
    '--site': { name: 'site' },
    '--dry-run': { name: 'dryRun', flag: true },
  },
});
if (args.help) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
  process.exit(0);
}

const { sites } = JSON.parse(readFileSync(args.config, 'utf8'));
const acct = loadAccount(args.key);
const token = await getToken(acct, SCOPE_EDIT);
let failed = 0;

for (const site of sites.filter((s) => !args.site || s.key === args.site)) {
  if (!site.propertyId) { console.log(`\n${site.name}: no propertyId in the config, skipped`); continue; }
  const prop = `properties/${site.propertyId}`;
  console.log(`\n${site.name} (${prop})`);

  try {
    const haveKeys = new Set((await listAll(token, `/${prop}/keyEvents`, 'keyEvents')).map((k) => k.eventName));
    for (const name of site.outcomes || []) {
      if (haveKeys.has(name)) { console.log(`  key event  ${name.padEnd(18)} already set`); continue; }
      console.log(`  key event  ${name.padEnd(18)} ${args.dryRun ? 'would create' : 'creating'}`);
      if (!args.dryRun) await api(token, 'POST', `${ADMIN_API}/${prop}/keyEvents`, { eventName: name, countingMethod: 'ONCE_PER_EVENT' });
    }

    const have = await listAll(token, `/${prop}/customDimensions`, 'customDimensions');
    const haveParams = new Set(have.filter((d) => d.scope === 'EVENT').map((d) => d.parameterName));
    const haveNames = new Set(have.map((d) => d.displayName));
    for (const d of site.dimensions || []) {
      if (haveParams.has(d.param)) { console.log(`  dimension  ${d.param.padEnd(18)} already set`); continue; }
      // Display names must be unique per property
      const displayName = haveNames.has(d.name) ? `${d.name} (${d.param})` : d.name;
      console.log(`  dimension  ${d.param.padEnd(18)} ${args.dryRun ? 'would create' : 'creating'} as "${displayName}"`);
      if (!args.dryRun) {
        await api(token, 'POST', `${ADMIN_API}/${prop}/customDimensions`, {
          parameterName: d.param, displayName, description: d.description || '', scope: 'EVENT',
        });
        haveNames.add(displayName);
      }
    }
  } catch (e) {
    failed++;
    const hint = e.status === 403
      ? ` — ${acct.client_email} needs the Editor role on this property (Admin → Property access management)`
      : '';
    console.log(`  ✗ ${e.message}${hint}`);
  }
}

console.log(args.dryRun ? '\nDry run only; nothing changed.' : '\nDone. New dimensions fill in for events collected from now on.');
if (failed) die(`${failed} propert${failed === 1 ? 'y' : 'ies'} could not be updated.`);
