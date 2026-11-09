#!/usr/bin/env node
/**
 * Cross-site GA4 rollup: elliottelford.com, Parker's Physics,
 * Explore the Universe 2175 and Telford Landscaping in one report.
 *
 * Each site reports into its own GA4 property (tools/ga4-sites.json).
 * This signs in once as a service account and joins them:
 *
 *   1. Outcomes on every site — leads, sign-ups, wishlist clicks — and
 *      how many came from a sibling site
 *   2. Traffic per site against the comparison period
 *   3. Hand-offs: impressions and clicks on elliottelford.com, then
 *      arrivals and outcomes on each project's own property
 *   4. Which placement on elliottelford.com sent them (utm_campaign)
 *   5. The full site-to-site referral matrix
 *
 * Outcomes are counted from each site's "outcomes" list in the config,
 * so they show up whether or not they are marked as key events yet.
 *
 * Node 18+, no npm install. Auth: --key <service-account.json>, or the
 * GA_SERVICE_ACCOUNT_KEY / GOOGLE_APPLICATION_CREDENTIALS env vars. The
 * account needs Viewer on all four properties.
 *
 *   node tools/ga4-rollup.mjs --key ~/.config/ga/ga-reporting.json              # last 28 days
 *   node tools/ga4-rollup.mjs --key ... --days 1 --compare lastweek             # daily
 *   node tools/ga4-rollup.mjs --key ... --days 7 --out rollup.md --json rollup.json
 *   node tools/ga4-rollup.mjs --key ... --discover                              # list properties
 *
 * --compare previous (default) compares with the N days before;
 * --compare lastweek compares with the same days one week earlier, which
 * keeps a daily report from comparing a Sunday with a Saturday.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMIN_API, DATA_API, api, die, getToken, listAll, loadAccount, parseArgs } from './ga4/google.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/* ---------------------------------------------------------------- args */

const args = parseArgs(process.argv.slice(2), {
  defaults: { days: '28', compare: 'previous', config: join(HERE, 'ga4-sites.json'), tz: 'America/Los_Angeles' },
  options: {
    '--key': { name: 'key' },
    '--days': { name: 'days' },
    '--compare': { name: 'compare' },
    '--out': { name: 'out' },
    '--json': { name: 'json' },
    '--config': { name: 'config' },
    '--title': { name: 'title' },
    '--tz': { name: 'tz' },
    '--discover': { name: 'discover', flag: true },
  },
});
if (args.help) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
  process.exit(0);
}
const DAYS = parseInt(args.days, 10);
if (!(DAYS > 0 && DAYS <= 365)) die('--days must be 1–365');
if (!['previous', 'lastweek'].includes(args.compare)) die('--compare must be previous or lastweek');
if (args.compare === 'lastweek' && DAYS > 7) die('--compare lastweek only works for --days 7 or fewer');

/* ----------------------------------------------------------- periods */

function ranges() {
  const current = { startDate: `${DAYS}daysAgo`, endDate: 'yesterday', name: 'current' };
  const previous = args.compare === 'lastweek'
    ? { startDate: `${DAYS + 7}daysAgo`, endDate: '8daysAgo', name: 'previous' }
    : { startDate: `${DAYS * 2}daysAgo`, endDate: `${DAYS + 1}daysAgo`, name: 'previous' };
  return { current, previous, both: [current, previous] };
}

// Human labels for the periods, in the properties' time zone
function dayLabel(daysAgo) {
  const d = new Date(Date.now() - daysAgo * 864e5);
  return d.toLocaleDateString('en-US', { timeZone: args.tz, weekday: 'short', month: 'short', day: 'numeric' });
}
function periodLabel() {
  const cur = DAYS === 1 ? dayLabel(1) : `${dayLabel(DAYS)} – ${dayLabel(1)}`;
  const prevEnd = args.compare === 'lastweek' ? 8 : DAYS + 1;
  const prevStart = args.compare === 'lastweek' ? DAYS + 7 : DAYS * 2;
  const prev = prevStart === prevEnd ? dayLabel(prevEnd) : `${dayLabel(prevStart)} – ${dayLabel(prevEnd)}`;
  return { cur, prev };
}

/* ----------------------------------------------------- property lookup */

async function listStreams(token) {
  const out = [];
  for (const acct of await listAll(token, '/accountSummaries', 'accountSummaries')) {
    for (const p of acct.propertySummaries || []) {
      for (const st of await listAll(token, `/${p.property}/dataStreams`, 'dataStreams')) {
        if (!st.webStreamData) continue;
        out.push({
          property: p.property.split('/')[1],
          propertyName: p.displayName,
          account: acct.displayName,
          measurementId: st.webStreamData.measurementId,
          uri: st.webStreamData.defaultUri || '',
        });
      }
    }
  }
  return out;
}

async function resolveSites(token, sites) {
  const streams = sites.some((s) => !s.propertyId) ? await listStreams(token) : [];
  return sites.map((s) => {
    if (s.propertyId) return { ...s };
    const hit = streams.find((st) =>
      (s.measurementId && st.measurementId === s.measurementId) ||
      (!s.measurementId && st.uri.includes(s.domain)));
    if (!hit) return { ...s, missing: `the service account can't see a GA4 stream for ${s.measurementId || s.domain}. Add it as Viewer on that property.` };
    return { ...s, propertyId: hit.property };
  });
}

/* ------------------------------------------------------------- reports */

function rows(report) {
  const dims = (report.dimensionHeaders || []).map((h) => h.name);
  const mets = (report.metricHeaders || []).map((h) => h.name);
  return (report.rows || []).map((r) => {
    const o = {};
    dims.forEach((d, i) => { o[d] = r.dimensionValues[i].value; });
    mets.forEach((m, i) => { o[m] = Number(r.metricValues[i].value); });
    return o;
  });
}

// "elliottelford.com", "www.parkersphysics.com" → that site's key
const siteForSource = (sites, source) => sites.find((x) => (source || '').toLowerCase().includes(x.match));

async function siteReport(token, site, sites) {
  const run = (body) => api(token, 'POST', `${DATA_API}/properties/${site.propertyId}:runReport`, body);
  const R = ranges();
  const out = { summary: { current: {}, previous: {} }, inbound: [], outcomes: [], outbound: [], errors: [] };
  const fromOf = (src) => siteForSource(sites, src)?.key || '';

  // Traffic, both periods
  for (const r of rows(await run({
    dateRanges: R.both,
    metrics: ['activeUsers', 'sessions', 'engagedSessions'].map((name) => ({ name })),
  }))) out.summary[r.dateRange || 'current'] = r;

  // Sessions that arrived from a sibling site, by source + campaign
  const siblings = sites.filter((x) => x.key !== site.key);
  out.inbound = rows(await run({
    dateRanges: [R.current],
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionCampaignName' }],
    metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
    dimensionFilter: { orGroup: { expressions: siblings.map((x) => ({
      filter: { fieldName: 'sessionSource', stringFilter: { matchType: 'CONTAINS', value: x.match, caseSensitive: false } },
    })) } },
    limit: 1000,
  })).map((r) => ({ ...r, from: fromOf(r.sessionSource) })).filter((r) => r.from && r.from !== site.key);

  // Outcomes, both periods, by where the session came from
  if ((site.outcomes || []).length) {
    out.outcomes = rows(await run({
      dateRanges: R.both,
      dimensions: [{ name: 'eventName' }, { name: 'sessionSource' }, { name: 'sessionCampaignName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: site.outcomes } } },
      limit: 5000,
    })).map((r) => ({ ...r, dateRange: r.dateRange || 'current', from: fromOf(r.sessionSource) }));
  }

  // On the hub: impressions and clicks out to each project, by placement
  if (site.hub) {
    try {
      out.outbound = rows(await run({
        dateRanges: [R.current],
        dimensions: [{ name: 'eventName' }, { name: 'customEvent:project' }, { name: 'customEvent:placement' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['project_click', 'wishlist_click', 'project_impression'] } } },
        limit: 1000,
      }));
    } catch (e) {
      out.errors.push(`Outbound clicks: ${e.message} (are the "project" and "placement" custom dimensions set up? Run tools/ga4-config.mjs.)`);
    }
  }
  return out;
}

/* ------------------------------------------------------------ assemble */

const num = (n) => (n == null || Number.isNaN(n) ? '–' : Math.round(n).toLocaleString('en-US'));
const pct = (n) => (n == null || !Number.isFinite(n) ? '–' : `${(n * 100).toFixed(1)}%`);
const sum = (list, f) => list.reduce((a, r) => a + (f ? f(r) : r), 0);
function delta(cur, prev) {
  if (!prev) return cur ? 'new' : '–';
  const d = (cur - prev) / prev;
  return `${d >= 0 ? '+' : ''}${(d * 100).toFixed(0)}%`;
}
function table(head, body) {
  if (!body.length) return '_Nothing in this period._\n';
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...body.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n';
}
const HUB_CLICKS = ['project_click', 'wishlist_click'];
const campaignOf = (r) => (r.sessionCampaignName && !r.sessionCampaignName.startsWith('(') ? r.sessionCampaignName : '(no utm_campaign)');

function build(sites, results) {
  const by = Object.fromEntries(sites.map((s) => [s.key, s]));
  const live = sites.filter((s) => results[s.key]);
  const dests = live.filter((s) => !s.hub);
  const hub = live.find((s) => s.hub);
  const { cur, prev } = periodLabel();
  const md = [];
  const json = { generated: new Date().toISOString(), days: DAYS, compare: args.compare, period: { current: cur, previous: prev }, sites: {}, outcomes: [], handoffs: [], placements: [], matrix: [] };

  // Outcomes first: they are the point
  const outcomeRows = [];
  let outCur = 0, outPrev = 0, outFromSiblings = 0;
  for (const s of live) {
    const o = results[s.key].outcomes;
    for (const ev of s.outcomes || []) {
      const c = o.filter((r) => r.eventName === ev && r.dateRange === 'current');
      const p = o.filter((r) => r.eventName === ev && r.dateRange === 'previous');
      const total = sum(c, (r) => r.eventCount);
      const prevTotal = sum(p, (r) => r.eventCount);
      const fromHub = hub && !s.hub ? sum(c.filter((r) => r.from === hub.key), (r) => r.eventCount) : null;
      const fromOther = sum(c.filter((r) => r.from && r.from !== s.key && (!hub || r.from !== hub.key || s.hub)), (r) => r.eventCount);
      // Clicks out of the hub are the start of a journey whose outcome is
      // counted on the destination; adding both would count it twice
      if (!(s.hub && HUB_CLICKS.includes(ev))) {
        outCur += total; outPrev += prevTotal; outFromSiblings += (fromHub || 0) + fromOther;
      }
      json.outcomes.push({ site: s.key, event: ev, count: total, previous: prevTotal, fromHub, fromOtherSites: fromOther });
      outcomeRows.push([s.name, `\`${ev}\``, num(total), delta(total, prevTotal), fromHub == null ? '–' : num(fromHub), num(fromOther)]);
    }
  }

  const title = args.title || `${DAYS === 1 ? 'Daily rollup' : DAYS === 7 ? 'Weekly rollup' : `${DAYS}-day rollup`} — ${cur}`;
  md.push(`# ${title}`);
  md.push(`**${num(outCur)} outcomes** across the sites (${delta(outCur, outPrev)} vs ${prev}), ${num(outFromSiblings)} of them from visitors another of your sites sent (clicks out of ${hub ? hub.name : 'the hub'} not counted here).\n`);
  json.headline = { outcomes: outCur, previous: outPrev, fromSiblings: outFromSiblings };

  md.push(`## Outcomes`);
  md.push(table(['Site', 'Outcome', 'Count', 'Change', 'From hub', 'From other sites'], outcomeRows));
  md.push(`_Change is against ${prev}. "From hub" means visitors ${hub ? hub.name : 'the hub'} sent. Outcomes are the events listed per site in tools/ga4-sites.json. Steam wishlists themselves are only in Steamworks; these count wishlist clicks._\n`);

  // Traffic
  md.push(`## Traffic`);
  const tot = { c: { u: 0, s: 0, e: 0 }, p: { u: 0, s: 0 } };
  const trafficRows = live.map((s) => {
    const { current: c = {}, previous: p = {} } = results[s.key].summary;
    json.sites[s.key] = { name: s.name, propertyId: s.propertyId, current: c, previous: p };
    tot.c.u += c.activeUsers || 0; tot.c.s += c.sessions || 0; tot.c.e += c.engagedSessions || 0;
    tot.p.u += p.activeUsers || 0; tot.p.s += p.sessions || 0;
    return [s.name, num(c.activeUsers), delta(c.activeUsers, p.activeUsers), num(c.sessions), delta(c.sessions, p.sessions), pct(c.sessions ? c.engagedSessions / c.sessions : null)];
  });
  trafficRows.push(['**All sites**', num(tot.c.u), delta(tot.c.u, tot.p.u), num(tot.c.s), delta(tot.c.s, tot.p.s), pct(tot.c.s ? tot.c.e / tot.c.s : null)]);
  md.push(table(['Site', 'Users', 'Change', 'Sessions', 'Change', 'Engaged'], trafficRows));
  md.push(`_All-sites users are summed across properties, so someone who visits two sites counts twice._\n`);

  // Hand-offs from the hub
  if (hub) {
    md.push(`## Hand-offs from ${hub.name}`);
    const outb = results[hub.key].outbound;
    const ev = (name, key) => sum(outb.filter((r) => r.eventName === name && r['customEvent:project'] === key), (r) => r.eventCount);
    const handRows = dests.map((d) => {
      const seen = ev('project_impression', d.key);
      const clicks = ev('project_click', d.key);
      const arr = results[d.key].inbound.filter((r) => r.from === hub.key);
      const arrived = sum(arr, (r) => r.sessions);
      const engaged = sum(arr, (r) => r.engagedSessions);
      const outcomes = sum(results[d.key].outcomes.filter((r) => r.dateRange === 'current' && r.from === hub.key), (r) => r.eventCount);
      json.handoffs.push({ project: d.key, impressions: seen, clicks, wishlistClicks: ev('wishlist_click', d.key), arrived, engaged, outcomes });
      return [d.name, num(seen), num(clicks), seen ? pct(clicks / seen) : '–', num(arrived), clicks ? pct(arrived / clicks) : '–', num(engaged), num(outcomes)];
    });
    md.push(table(['Project', 'Seen', 'Clicks', 'Click rate', 'Arrived', 'Arrival rate', 'Engaged', 'Outcomes there'], handRows));
    md.push(`_Seen and Clicks are measured on ${hub.name}; Arrived and Outcomes on the project's own property. Arrival rates under 100% are normal (ad blockers, consent, back-button); a sudden drop usually means a broken link._\n`);
    for (const e of results[hub.key].errors) md.push(`> ⚠ ${e}\n`);

    // Placement
    md.push(`### Which placement sent them`);
    const place = {};
    const slot = (placement, project) => (place[`${placement}|${project}`] ||= { placement, project, clicks: 0, arrived: 0, outcomes: 0 });
    for (const r of outb.filter((r) => r.eventName === 'project_click')) slot(r['customEvent:placement'], r['customEvent:project']).clicks += r.eventCount;
    for (const d of dests) {
      for (const r of results[d.key].inbound.filter((r) => r.from === hub.key)) slot(campaignOf(r), d.key).arrived += r.sessions;
      for (const r of results[d.key].outcomes.filter((r) => r.dateRange === 'current' && r.from === hub.key)) slot(campaignOf(r), d.key).outcomes += r.eventCount;
    }
    json.placements = Object.values(place).sort((a, b) => b.clicks + b.arrived - (a.clicks + a.arrived));
    md.push(table(['Placement', 'Project', 'Clicks', 'Arrived', 'Outcomes there'],
      json.placements.map((r) => [`\`${r.placement}\``, by[r.project]?.name || r.project, num(r.clicks), num(r.arrived), num(r.outcomes)])));
  }

  // Matrix
  md.push(`## Site-to-site referrals`);
  for (const d of live) {
    const agg = {};
    for (const r of results[d.key].inbound) {
      const a = (agg[r.from] ||= { sessions: 0, engaged: 0, outcomes: 0 });
      a.sessions += r.sessions; a.engaged += r.engagedSessions;
    }
    for (const r of results[d.key].outcomes.filter((r) => r.dateRange === 'current' && r.from && r.from !== d.key)) {
      (agg[r.from] ||= { sessions: 0, engaged: 0, outcomes: 0 }).outcomes += r.eventCount;
    }
    for (const [from, v] of Object.entries(agg)) json.matrix.push({ from, to: d.key, ...v });
  }
  json.matrix.sort((a, b) => b.sessions - a.sessions);
  md.push(table(['From', 'To', 'Sessions', 'Engaged', 'Outcomes'],
    json.matrix.map((m) => [by[m.from]?.name || m.from, by[m.to].name, num(m.sessions), pct(m.sessions ? m.engaged / m.sessions : null), num(m.outcomes)])));

  const missing = sites.filter((s) => s.missing || s.failed);
  if (missing.length) {
    md.push(`## Not included`);
    for (const s of missing) md.push(`- **${s.name}**: ${s.missing || s.failed}`);
    md.push('');
  }
  md.push(`_${cur} vs ${prev}. Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC. GA can take up to 48 hours to settle, so the latest day may still rise._`);
  return { md: md.join('\n'), json };
}

/* ---------------------------------------------------------------- main */

const acct = loadAccount(args.key);
const token = await getToken(acct);

if (args.discover) {
  const streams = await listStreams(token);
  if (!streams.length) die(`${acct.client_email} can't see any GA4 properties yet. Add it as Viewer in each property's Admin → Property access management.`);
  console.log(table(['Property id', 'Property', 'Account', 'Measurement id', 'URL'], streams.map((s) => [s.property, s.propertyName, s.account, s.measurementId, s.uri])));
  process.exit(0);
}

let config;
try { config = JSON.parse(readFileSync(args.config, 'utf8')); }
catch (e) { die(`Can't read ${args.config}: ${e.message}`); }

const sites = await resolveSites(token, config.sites);
const results = {};
await Promise.all(sites.filter((s) => !s.missing).map(async (s) => {
  try { results[s.key] = await siteReport(token, s, sites); }
  catch (e) { s.failed = e.status === 403 ? `no access (${acct.client_email} needs Viewer on property ${s.propertyId})` : e.message; }
}));
if (!Object.keys(results).length) die('No property could be read:\n' + sites.map((s) => `  ${s.name}: ${s.missing || s.failed}`).join('\n'));

const { md, json } = build(sites, results);
if (args.out) writeFileSync(args.out, md);
if (args.json) writeFileSync(args.json, JSON.stringify(json, null, 2));
if (!args.out) console.log(md);
else console.log(`Wrote ${args.out}${args.json ? ` and ${args.json}` : ''}`);
