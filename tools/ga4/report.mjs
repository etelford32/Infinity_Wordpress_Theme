/** Collection and rendering for GA rollups. null means unavailable; [] means zero rows. */
import { api, DATA_API } from './google.mjs';
import { GoogleRequestError } from './http.mjs';

export function failure(error, stage, propertyId) {
  // Never propagate arbitrary fetch/server messages into a public Actions log.
  const known = error instanceof GoogleRequestError;
  return {
    stage, propertyId: propertyId || null,
    code: known ? error.code : 'QUERY_FAILED',
    status: known ? error.status : null,
    contentType: known ? error.contentType : null,
    attempts: known ? error.attempts : 1,
  };
}

export function unavailable(site, error) {
  return { summary: null, acquisition: null, landing: null, inbound: null, outcomes: null, outbound: site.hub ? null : [], errors: [error] };
}

function rows(report, body) {
  const invalid = () => { throw new GoogleRequestError('INVALID_REPORT', { status: 200 }); };
  if (!Array.isArray(report.metricHeaders) || !Array.isArray(report.dimensionHeaders)) invalid();
  const dims = report.dimensionHeaders.map((h) => h.name);
  const mets = report.metricHeaders.map((h) => h.name);
  if (body.metrics.some((m) => !mets.includes(m.name)) ||
      (body.dimensions || []).some((d) => !dims.includes(d.name))) invalid();
  const records = report.rows || [];
  if (!Array.isArray(records)) invalid();
  if (report.rowCount > records.length) throw new GoogleRequestError('REPORT_TRUNCATED', { status: 200 });
  if (records.length && body.dateRanges.length > 1 && !dims.includes('dateRange')) invalid();
  return records.map((r) => {
    if (r.dimensionValues?.length !== dims.length || r.metricValues?.length !== mets.length) invalid();
    const out = {};
    dims.forEach((d, i) => {
      if (typeof r.dimensionValues[i].value !== 'string') invalid();
      out[d] = r.dimensionValues[i].value;
    });
    mets.forEach((m, i) => {
      const value = r.metricValues[i].value;
      if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value))) invalid();
      out[m] = Number(value);
    });
    if (out.dateRange && !body.dateRanges.some((d) => d.name === out.dateRange)) invalid();
    return out;
  });
}

const siteForSource = (sites, source) => sites.find((x) => (source || '').toLowerCase().includes(x.match));

export async function siteReport(token, site, sites, periods, request = api) {
  const out = { summary: null, acquisition: null, landing: null, inbound: null, outcomes: [], outbound: [], errors: [] };
  const fromOf = (src) => siteForSource(sites, src)?.key || '';
  async function query(field, stage, body, convert) {
    try {
      const response = await request(token, 'POST', `${DATA_API}/properties/${site.propertyId}:runReport`, body);
      out[field] = convert(rows(response, body));
    } catch (error) {
      out[field] = null;
      out.errors.push(failure(error, stage, site.propertyId));
    }
  }

  await query('summary', 'traffic', {
    dateRanges: periods.both,
    metrics: ['activeUsers', 'sessions', 'engagedSessions', 'newUsers', 'screenPageViews', 'userEngagementDuration'].map((name) => ({ name })),
  }, (records) => {
    const zero = () => ({ activeUsers: 0, sessions: 0, engagedSessions: 0, newUsers: 0, screenPageViews: 0, userEngagementDuration: 0 });
    const summary = { current: zero(), previous: zero() };
    for (const r of records) summary[r.dateRange || 'current'] = r;
    return summary;
  });

  // Diagnostic breakdowns are session-scoped. Use the landing page PATH,
  // not a path with query parameters, to avoid emailing tokens or PII.
  const qualityMetrics = ['sessions', 'engagedSessions', 'userEngagementDuration'].map((name) => ({ name }));
  const bySessions = [{ metric: { metricName: 'sessions' }, desc: true }];
  await query('acquisition', 'acquisition', {
    dateRanges: [periods.current],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: qualityMetrics,
    orderBys: bySessions,
    limit: 10000,
  }, (records) => records);

  await query('landing', 'landing pages', {
    dateRanges: [periods.current],
    dimensions: [{ name: 'landingPage' }],
    metrics: qualityMetrics,
    orderBys: bySessions,
    limit: 10000,
  }, (records) => records);

  const siblings = sites.filter((x) => x.key !== site.key);
  if (!siblings.length) out.inbound = [];
  else await query('inbound', 'referrals', {
    dateRanges: [periods.current],
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionCampaignName' }],
    metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
    dimensionFilter: { orGroup: { expressions: siblings.map((x) => ({
      filter: { fieldName: 'sessionSource', stringFilter: { matchType: 'CONTAINS', value: x.match, caseSensitive: false } },
    })) } },
    limit: 1000,
  }, (records) => records.map((r) => ({ ...r, from: fromOf(r.sessionSource) })).filter((r) => r.from && r.from !== site.key));

  if ((site.outcomes || []).length) await query('outcomes', 'outcomes', {
    dateRanges: periods.both,
    dimensions: [{ name: 'eventName' }, { name: 'sessionSource' }, { name: 'sessionCampaignName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: site.outcomes } } },
    limit: 5000,
  }, (records) => records.map((r) => ({ ...r, dateRange: r.dateRange || 'current', from: fromOf(r.sessionSource) })));

  if (site.hub) await query('outbound', 'outbound', {
    dateRanges: [periods.current],
    dimensions: [{ name: 'eventName' }, { name: 'customEvent:project' }, { name: 'customEvent:placement' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['project_click', 'wishlist_click', 'project_impression'] } } },
    limit: 1000,
  }, (records) => records);
  return out;
}

const num = (n) => (n == null || !Number.isFinite(n) ? 'Unavailable' : Math.round(n).toLocaleString('en-US'));
const sum = (list, f) => list.reduce((a, r) => a + f(r), 0);
const total = (list, f) => list == null ? null : sum(list, f);
const ratio = (n, d) => n == null || d == null ? 'Unavailable' : d ? `${(n / d * 100).toFixed(1)}%` : '–';
function delta(cur, prev) {
  if (cur == null || prev == null) return 'Unavailable';
  if (!prev) return cur ? 'new' : '–';
  const d = (cur - prev) / prev;
  return `${d >= 0 ? '+' : ''}${(d * 100).toFixed(0)}%`;
}
export function table(head, body, empty = 'Nothing in this period.') {
  if (!body.length) return `_${empty}_\n`;
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...body.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n';
}
const HUB_CLICKS = ['project_click', 'wishlist_click'];
const campaignOf = (r) => (r.sessionCampaignName && !r.sessionCampaignName.startsWith('(') ? r.sessionCampaignName : '(no utm_campaign)');
const fields = { traffic: 'summary', acquisition: 'acquisition', landing: 'landing', referrals: 'inbound', outcomes: 'outcomes', outbound: 'outbound' };
const activeSeconds = (seconds, sessions) =>
  seconds == null || sessions == null ? 'Unavailable' : sessions ? (seconds / sessions).toFixed(1) + 's' : '–';
const perSession = (count, sessions) =>
  count == null || sessions == null ? 'Unavailable' : sessions ? (count / sessions).toFixed(2) : '–';
const safeLabel = (value) => String(value ?? '(not set)').replace(/[|*\r\n]/g, ' ').slice(0, 90);

export function build(sites, results, { days, compare, period, title, generated = new Date().toISOString() }) {
  const by = Object.fromEntries(sites.map((s) => [s.key, s]));
  const hub = sites.find((s) => s.hub);
  const dests = sites.filter((s) => !s.hub);
  const available = (site, section) => results[site.key]?.[fields[section]] != null;
  const coverage = { totalSites: sites.length, completeSites: 0, sections: {} };
  for (const section of Object.keys(fields)) {
    const applicable = section === 'outbound' ? sites.filter((s) => s.hub) : sites;
    coverage.sections[section] = { available: applicable.filter((s) => available(s, section)).length, total: applicable.length };
  }
  const all = (section) => coverage.sections[section].available === coverage.sections[section].total;
  coverage.completeSites = sites.filter((s) => Object.keys(fields).every((section) => section === 'outbound' && !s.hub || available(s, section))).length;
  const complete = coverage.completeSites === sites.length;
  const errors = sites.flatMap((s) => (results[s.key]?.errors || []).map((e) => ({ site: s.key, ...e })));
  const { cur, prev } = period;
  const md = [];
  const json = { generated, days, compare, period: { current: cur, previous: prev }, status: complete ? 'complete' : 'incomplete', coverage, errors, sites: {}, outcomes: [], handoffs: [], placements: [], matrix: [], acquisition: [], landingPages: [], qualityAlerts: [] };
  const baseTitle = title || `${days === 1 ? 'Daily rollup' : days === 7 ? 'Weekly rollup' : `${days}-day rollup`} — ${cur}`;
  md.push(`# ${baseTitle}${complete ? '' : ` — INCOMPLETE (${coverage.completeSites}/${sites.length} sites complete)`}`);
  if (!complete) {
    md.push(`**Incomplete data: ${coverage.completeSites} of ${sites.length} sites complete.** Unavailable values are not zero.\n`);
    md.push(table(['Section', 'Sites available'], Object.entries(coverage.sections).filter(([, c]) => c.total).map(([section, c]) => [section, `${c.available}/${c.total}`])));
  }

  const outcomeRows = [];
  let outCur = 0, outPrev = 0, outFromSiblings = 0;
  for (const s of sites) {
    const o = results[s.key]?.outcomes;
    for (const ev of s.outcomes || []) {
      const c = o?.filter((r) => r.eventName === ev && r.dateRange === 'current');
      const p = o?.filter((r) => r.eventName === ev && r.dateRange === 'previous');
      const count = total(c, (r) => r.eventCount);
      const previous = total(p, (r) => r.eventCount);
      const fromHub = hub && !s.hub ? total(c?.filter((r) => r.from === hub.key), (r) => r.eventCount) : null;
      const fromOther = total(c?.filter((r) => r.from && r.from !== s.key && (!hub || r.from !== hub.key || s.hub)), (r) => r.eventCount);
      if (!(s.hub && HUB_CLICKS.includes(ev)) && count != null) {
        outCur += count; outPrev += previous; outFromSiblings += (fromHub || 0) + fromOther;
      }
      json.outcomes.push({ site: s.key, event: ev, count, previous, fromHub, fromOtherSites: fromOther });
      outcomeRows.push([s.name, `\`${ev}\``, num(count), delta(count, previous), hub && !s.hub ? num(fromHub) : '–', num(fromOther)]);
    }
  }
  json.headline = { outcomes: all('outcomes') ? outCur : null, previous: all('outcomes') ? outPrev : null, fromSiblings: all('outcomes') ? outFromSiblings : null };
  md.push(all('outcomes')
    ? `**${num(outCur)} outcomes** across the sites (${delta(outCur, outPrev)} vs ${prev}), ${num(outFromSiblings)} of them from visitors another of your sites sent (clicks out of ${hub?.name || 'the hub'} not counted here).\n`
    : '**Total outcomes: Unavailable.** One or more properties could not supply outcomes.\n');
  md.push('## Outcomes', table(['Site', 'Outcome', 'Count', 'Change', 'From hub', 'From other sites'], outcomeRows));
  md.push(`_Change is against ${prev}. "From hub" means visitors ${hub?.name || 'the hub'} sent. Outcomes are the events listed per site in tools/ga4-sites.json. Steam wishlists themselves are only in Steamworks; these count wishlist clicks._\n`);

  md.push('## Traffic');
  const blank = () => ({ activeUsers: 0, sessions: 0, engagedSessions: 0, newUsers: 0, screenPageViews: 0, userEngagementDuration: 0 });
  const totals = { current: blank(), previous: blank() };
  const trafficRows = sites.map((s) => {
    const summary = results[s.key]?.summary;
    const c = summary?.current, p = summary?.previous;
    json.sites[s.key] = { name: s.name, propertyId: s.propertyId || null, current: c || null, previous: p || null,
      sections: Object.fromEntries(Object.keys(fields).map((section) => [section, available(s, section) ? 'available' : 'unavailable'])) };
    if (summary) for (const period of ['current', 'previous']) for (const metric of Object.keys(totals[period])) totals[period][metric] += summary[period][metric];
    return [s.name, num(c?.activeUsers), delta(c?.activeUsers, p?.activeUsers), num(c?.sessions), delta(c?.sessions, p?.sessions), ratio(c?.engagedSessions, c?.sessions)];
  });
  json.trafficTotals = all('traffic') ? totals : null;
  const c = json.trafficTotals?.current, p = json.trafficTotals?.previous;
  trafficRows.push(['**All sites**', num(c?.activeUsers), delta(c?.activeUsers, p?.activeUsers), num(c?.sessions), delta(c?.sessions, p?.sessions), ratio(c?.engagedSessions, c?.sessions)]);
  md.push(table(['Site', 'Users', 'Change', 'Sessions', 'Change', 'Engaged'], trafficRows));
  md.push('_All-sites users are summed across properties, so someone who visits two sites counts twice. Totals are unavailable when any traffic query fails._\n');

  // An engagement rate alone hides whether the number of genuinely
  // engaged sessions grew. Keep both the numerator and the denominator.
  md.push('## Engagement quality');
  const qualityRows = sites.map((s) => {
    const v = results[s.key]?.summary?.current;
    if (v?.sessions >= 50 && v.engagedSessions / v.sessions < 0.05) {
      json.qualityAlerts.push({ site: s.key, type: 'low-engagement-traffic', sessions: v.sessions, engagedSessions: v.engagedSessions });
    }
    return [s.name, num(v?.engagedSessions), ratio(v?.engagedSessions, v?.sessions),
      activeSeconds(v?.userEngagementDuration, v?.sessions),
      perSession(v?.screenPageViews, v?.sessions), num(v?.newUsers)];
  });
  if (c) qualityRows.push(['**All sites**', num(c.engagedSessions), ratio(c.engagedSessions, c.sessions),
    activeSeconds(c.userEngagementDuration, c.sessions),
    perSession(c.screenPageViews, c.sessions), num(c.newUsers)]);
  md.push(table(['Site', 'Engaged sessions', 'Rate', 'Active time/session', 'Views/session', 'New users'], qualityRows));
  md.push('_Active time/session is GA4 foreground engagement duration divided by sessions, not elapsed page-open time. Small-sample rates should not drive decisions._\n');

  // Show the segments responsible for volume, with their quality alongside.
  // Daily email is intentionally concise; JSON retains all returned rows.
  for (const spec of [
    { field: 'acquisition', key: 'acquisition', dim: 'sessionSourceMedium', label: 'Source / medium', title: '## Acquisition quality' },
    { field: 'landing', key: 'landingPages', dim: 'landingPage', label: 'Landing page path', title: '## Landing-page quality' },
  ]) {
    md.push(spec.title);
    const segmentRows = [];
    for (const s of sites) {
      const vals = results[s.key]?.[spec.field];
      if (vals == null) {
        segmentRows.push([s.name, 'Unavailable', 'Unavailable', 'Unavailable', 'Unavailable']);
        continue;
      }
      json[spec.key].push(...vals.map((row) => ({ site: s.key, ...row })));
      for (const row of [...vals].sort((a, b) => b.sessions - a.sessions).slice(0, 3)) {
        segmentRows.push([s.name, safeLabel(row[spec.dim]), num(row.sessions),
          ratio(row.engagedSessions, row.sessions),
          activeSeconds(row.userEngagementDuration, row.sessions)]);
      }
    }
    md.push(table(['Site', spec.label, 'Sessions', 'Eng. rate', 'Active time/session'], segmentRows));
    md.push('_Top 3 per property by session count; engagement figures are descriptive, not automated-traffic verdicts._\n');
  }

  if (json.qualityAlerts.length) {
    md.push('### Traffic-quality checks');
    for (const a of json.qualityAlerts) {
      md.push('- **' + by[a.site].name + '**: ' + num(a.sessions) + ' sessions but ' +
        num(a.engagedSessions) + ' engaged (' + ratio(a.engagedSessions, a.sessions) +
        '). Check source/medium, landing pages, and server logs before attributing this to people or bots.');
    }
  }

  if (hub) {
    md.push(`## Hand-offs from ${hub.name}`);
    const outb = results[hub.key]?.outbound;
    const ev = (name, key) => total(outb?.filter((r) => r.eventName === name && r['customEvent:project'] === key), (r) => r.eventCount);
    const handRows = dests.map((d) => {
      const seen = ev('project_impression', d.key), clicks = ev('project_click', d.key);
      const arr = results[d.key]?.inbound?.filter((r) => r.from === hub.key);
      const arrived = total(arr, (r) => r.sessions), engaged = total(arr, (r) => r.engagedSessions);
      const outcomes = total(results[d.key]?.outcomes?.filter((r) => r.dateRange === 'current' && r.from === hub.key), (r) => r.eventCount);
      json.handoffs.push({ project: d.key, impressions: seen, clicks, wishlistClicks: ev('wishlist_click', d.key), arrived, engaged, outcomes });
      return [d.name, num(seen), num(clicks), ratio(clicks, seen), num(arrived), ratio(arrived, clicks), num(engaged), num(outcomes)];
    });
    md.push(table(['Project', 'Seen', 'Clicks', 'Click rate', 'Arrived', 'Arrival rate', 'Engaged', 'Outcomes there'], handRows));
    md.push(`_Seen counts only instrumented project blocks; article-link clicks may have no Seen event. Clicks are measured on ${hub.name}, but arrivals are attributed sessions in separate GA4 properties, not matched people or guaranteed click-throughs. Treat click and arrival rates as diagnostic estimates, not a verified funnel._\n`);

    md.push('### Which placement sent them');
    const place = new Map();
    function slot(placement, project) {
      const key = JSON.stringify([placement, project]);
      if (!place.has(key)) place.set(key, { placement, project, clicks: outb == null ? null : 0,
        arrived: available(by[project], 'referrals') ? 0 : null, outcomes: available(by[project], 'outcomes') ? 0 : null });
      return place.get(key);
    }
    for (const r of outb || []) if (r.eventName === 'project_click' && by[r['customEvent:project']]) slot(r['customEvent:placement'], r['customEvent:project']).clicks += r.eventCount;
    for (const d of dests) {
      for (const r of results[d.key]?.inbound || []) if (r.from === hub.key) slot(campaignOf(r), d.key).arrived += r.sessions;
      for (const r of results[d.key]?.outcomes || []) if (r.dateRange === 'current' && r.from === hub.key) slot(campaignOf(r), d.key).outcomes += r.eventCount;
    }
    json.placements = [...place.values()].sort((a, b) => (b.clicks || 0) + (b.arrived || 0) - (a.clicks || 0) - (a.arrived || 0));
    const placementsComplete = all('outbound') && all('referrals') && all('outcomes');
    if (!placementsComplete) md.push('_Some placement data is unavailable; the rows below are incomplete._');
    md.push(table(['Placement', 'Project', 'Clicks', 'Arrived', 'Outcomes there'], json.placements.map((r) =>
      [`\`${r.placement}\``, by[r.project].name, num(r.clicks), num(r.arrived), num(r.outcomes)]), placementsComplete ? 'Nothing in this period.' : 'Unavailable: placement data could not be fully read.'));
  }

  md.push('## Site-to-site referrals');
  for (const d of sites) {
    const result = results[d.key];
    const agg = new Map();
    function slot(from) {
      if (!agg.has(from)) agg.set(from, { sessions: result?.inbound == null ? null : 0, engaged: result?.inbound == null ? null : 0, outcomes: result?.outcomes == null ? null : 0 });
      return agg.get(from);
    }
    for (const r of result?.inbound || []) { const a = slot(r.from); a.sessions += r.sessions; a.engaged += r.engagedSessions; }
    for (const r of result?.outcomes || []) if (r.dateRange === 'current' && r.from && r.from !== d.key) slot(r.from).outcomes += r.eventCount;
    for (const [from, v] of agg) json.matrix.push({ from, to: d.key, ...v });
  }
  json.matrix.sort((a, b) => (b.sessions || 0) - (a.sessions || 0));
  const matrixComplete = all('referrals') && all('outcomes');
  if (!matrixComplete) md.push('_Some referral data is unavailable; the rows below are incomplete._');
  md.push(table(['From', 'To', 'Sessions', 'Engaged', 'Outcomes'], json.matrix.map((m) =>
    [by[m.from]?.name || m.from, by[m.to].name, num(m.sessions), ratio(m.engaged, m.sessions), num(m.outcomes)]), matrixComplete ? 'Nothing in this period.' : 'Unavailable: referral data could not be fully read.'));

  if (errors.length) {
    md.push('## Unavailable data');
    for (const e of errors) md.push(`- **${by[e.site].name}** — ${e.stage}, property ${e.propertyId || 'unresolved'}: ${e.code}${e.status == null ? '' : ` (HTTP ${e.status})`}${e.contentType ? `, ${e.contentType}` : ''}; ${e.attempts} attempt(s).${e.status === 403 ? ' Check the service account’s access to this property.' : ''}`);
  }
  md.push(`_${cur} vs ${prev}. Generated ${generated.slice(0, 16).replace('T', ' ')} UTC. GA can take up to 48 hours to settle, so the latest day may still rise._`);
  return { md: md.join('\n'), json };
}
