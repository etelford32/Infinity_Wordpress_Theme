#!/usr/bin/env node
/**
 * Email a rollup (the Markdown ga4-rollup.mjs writes) through Resend.
 *
 * The report never goes to stdout: this repository is public, so its
 * Actions logs are public too, and the numbers belong in an inbox.
 *
 *   RESEND_API_KEY=... REPORT_EMAIL_TO=you@example.com \
 *     node tools/ga4-email.mjs rollup.md
 *
 * Env:
 *   RESEND_API_KEY     required — the same kind of key Telford Landscaping uses
 *   REPORT_EMAIL_TO    required — comma-separated recipients
 *   REPORT_EMAIL_FROM  optional — default "GA Rollup <onboarding@resend.dev>",
 *                      which Resend only delivers to the account owner's address
 *                      until a domain is verified there
 *
 * --preview out.html writes the HTML instead of sending (for checking the layout).
 */

import { readFileSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const previewAt = argv.indexOf('--preview');
const preview = previewAt >= 0 ? argv.splice(previewAt, 2)[1] : '';
const file = argv[0];
if (!file) { console.error('Usage: node tools/ga4-email.mjs report.md [--preview out.html]'); process.exit(1); }

const md = readFileSync(file, 'utf8');

/* ---------------------------------------------- Markdown → email HTML */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/`(.+?)`/g, '<code style="background:#eef0f6;padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
  .replace(/(^|\s)_(.+?)_(?=\s|$|[.,;:])/g, '$1<em>$2</em>');

const S = {
  h1: 'font:700 22px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;margin:0 0 8px;color:#111827',
  h2: 'font:700 17px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;margin:28px 0 8px;color:#111827;border-bottom:2px solid #6366f1;padding-bottom:4px',
  h3: 'font:700 14px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;margin:20px 0 6px;color:#374151',
  p: 'font:14px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;margin:6px 0;color:#374151',
  small: 'font:12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;margin:6px 0;color:#6b7280',
  table: 'border-collapse:collapse;width:100%;font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;margin:6px 0',
  th: 'text-align:left;padding:6px 8px;border-bottom:1px solid #d1d5db;color:#6b7280;font-weight:600;white-space:nowrap',
  td: 'padding:6px 8px;border-bottom:1px solid #eef0f6;color:#111827',
};
const cell = (c) => c.trim();
const isNum = (c) => /^[+\-–]?[\d,.]+%?$|^new$|^–$/.test(c.replace(/\*\*/g, '').trim());

function toHtml(src) {
  const out = [];
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\|/.test(l)) {
      const block = [];
      while (i < lines.length && /^\|/.test(lines[i])) block.push(lines[i++]);
      i--;
      const [head, , ...body] = block.map((r) => r.replace(/^\||\|$/g, '').split('|').map(cell));
      // A column is numeric when every body cell is: those align right
      const numCol = head.map((_, j) => body.length > 0 && body.every((r) => isNum(r[j] || '')));
      out.push(`<table style="${S.table}"><tr>${head.map((h, j) => `<th style="${S.th}${numCol[j] ? ';text-align:right' : ''}">${inline(h)}</th>`).join('')}</tr>`);
      for (const r of body) out.push(`<tr>${r.map((c, j) => `<td style="${S.td}${numCol[j] ? ';text-align:right' : ''}">${inline(c)}</td>`).join('')}</tr>`);
      out.push('</table>');
    } else if (/^# /.test(l)) out.push(`<h1 style="${S.h1}">${inline(l.slice(2))}</h1>`);
    else if (/^## /.test(l)) out.push(`<h2 style="${S.h2}">${inline(l.slice(3))}</h2>`);
    else if (/^### /.test(l)) out.push(`<h3 style="${S.h3}">${inline(l.slice(4))}</h3>`);
    else if (/^- /.test(l)) out.push(`<p style="${S.p}">• ${inline(l.slice(2))}</p>`);
    else if (/^> /.test(l)) out.push(`<p style="${S.p};background:#fef3c7;padding:8px 10px;border-radius:6px">${inline(l.slice(2))}</p>`);
    else if (/^_.*_$/.test(l.trim())) out.push(`<p style="${S.small}">${inline(l.trim().slice(1, -1))}</p>`);
    else if (l.trim()) out.push(`<p style="${S.p}">${inline(l)}</p>`);
  }
  return `<!doctype html><html><body style="margin:0;background:#f5f6fa"><div style="max-width:720px;margin:0 auto;padding:24px;background:#ffffff">${out.join('\n')}</div></body></html>`;
}

const html = toHtml(md);
if (preview) {
  writeFileSync(preview, html);
  console.log(`Wrote ${preview}`);
  process.exit(0);
}

/* ------------------------------------------------------------- send */

const key = process.env.RESEND_API_KEY;
const to = (process.env.REPORT_EMAIL_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
if (!key || !to.length) { console.error('RESEND_API_KEY and REPORT_EMAIL_TO must be set.'); process.exit(1); }

const title = (md.match(/^# (.+)$/m) || [, 'GA rollup'])[1];
const headline = (md.match(/^\*\*(.+?)\*\*/m) || [, ''])[1];
const subject = headline ? `${title}: ${headline}` : title;

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: process.env.REPORT_EMAIL_FROM || 'GA Rollup <onboarding@resend.dev>',
    to,
    subject,
    html,
    text: md,
  }),
});
const data = await res.json().catch(() => ({}));
if (!res.ok) {
  // Resend's error never contains the report, so it is safe to log
  console.error(`Resend refused the email (${res.status}): ${data.message || data.name || 'unknown error'}`);
  process.exit(1);
}
console.log(`Sent "${title}" to ${to.length} recipient${to.length === 1 ? '' : 's'}.`);
